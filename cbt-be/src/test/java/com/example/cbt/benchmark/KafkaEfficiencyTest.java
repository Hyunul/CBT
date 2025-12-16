package com.example.cbt.benchmark;

import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, brokerProperties = { 
    "listeners=PLAINTEXT://localhost:9092", 
    "port=9092",
    "log.dir=./build/kafka-logs" // Use a safe local directory to avoid permission issues
})
public class KafkaEfficiencyTest {

    @Autowired
    private AttemptRepository attemptRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;

    // Define the consumer bean within a TestConfiguration class
    @TestConfiguration
    static class KafkaTestConfig {
        @Bean
        public BenchmarkConsumer benchmarkConsumer() {
            return new BenchmarkConsumer();
        }
    }

    public static class BenchmarkConsumer {
        private CountDownLatch latch = new CountDownLatch(1);
        private long receiveTime;

        @KafkaListener(topics = "benchmark-topic", groupId = "benchmark-group")
        public void consume(ExamGradedEvent event) {
            receiveTime = System.nanoTime();
            latch.countDown();
        }

        public void resetLatch() {
            latch = new CountDownLatch(1);
        }

        public boolean waitForMessage(long timeout, TimeUnit unit) throws InterruptedException {
            return latch.await(timeout, unit);
        }
        
        public long getReceiveTime() {
            return receiveTime;
        }
    }

    @Autowired
    private BenchmarkConsumer benchmarkConsumer;

    private User testUser;
    private Exam testExam;

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        examRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder().username("benchUser").email("b@test.com").password("pw").role(Role.ROLE_USER).build());
        testExam = examRepository.save(Exam.builder().title("Bench Exam").durationSec(100).build());
    }

    @Test
    @DisplayName("Hypothesis Verification: Direct DB Save vs Kafka Round-Trip Latency")
    void compareDirectVsKafka() throws InterruptedException {
        System.out.println("\n=======================================================");
        System.out.println("   Kafka Efficiency Test (Embedded Broker)");
        System.out.println("   Goal: Prove 'Direct DB' is faster for simple flows");
        System.out.println("=======================================================\n");

        // --- 1. Warm-up (JVM & Kafka initialization) ---
        kafkaTemplate.send("benchmark-topic", new ExamGradedEvent(1L, 1L, 0));
        benchmarkConsumer.waitForMessage(5, TimeUnit.SECONDS);
        benchmarkConsumer.resetLatch();
        System.out.println(">> Warm-up complete.\n");


        // --- 2. Measure Direct DB Save (Sync) ---
        long startSync = System.nanoTime();
        
        Attempt attempt = Attempt.builder()
                .user(testUser)
                .exam(testExam)
                .startedAt(Instant.now())
                .totalScore(100)
                .build();
        attemptRepository.save(attempt); // The actual logic we want to compare
        
        long endSync = System.nanoTime();
        double syncMs = (endSync - startSync) / 1_000_000.0;
        
        System.out.printf("[Case A: Direct DB] Time taken: %.4f ms%n", syncMs);


        // --- 3. Measure Kafka Round-Trip (Async overhead) ---
        long startKafka = System.nanoTime();
        
        kafkaTemplate.send("benchmark-topic", new ExamGradedEvent(testUser.getId(), testExam.getId(), 100));
        boolean received = benchmarkConsumer.waitForMessage(10, TimeUnit.SECONDS);
        
        long endKafka = System.nanoTime(); 
        double kafkaMs = (endKafka - startKafka) / 1_000_000.0;

        assertThat(received).isTrue();

        System.out.printf("[Case B: Kafka Flow] Time taken: %.4f ms%n", kafkaMs);


        // --- 4. Conclusion Report ---
        System.out.println("\n=======================================================");
        System.out.println("   Final Result Analysis");
        System.out.println("=======================================================");
        System.out.printf("1. Direct DB Save:   %8.4f ms%n", syncMs);
        System.out.printf("2. Kafka Processing: %8.4f ms (End-to-End)%n", kafkaMs);
        
        double overhead = kafkaMs / syncMs;
        System.out.printf("\n>> Kafka is %.1fx SLOWER than direct DB save.%n", overhead);
        
        if (kafkaMs > syncMs) {
            System.out.println(">> VERDICT: Hypothesis PROVEN.");
            System.out.println("   For simple data persistence, using Kafka introduces significant");
            System.out.println("   latency overhead due to serialization, I/O, and context switching.");
            System.out.println("   It is better NOT to use Kafka unless you need decoupling or handle massive scale.");
        } else {
            System.out.println(">> VERDICT: Hypothesis NOT PROVEN (Unexpected).");
        }
        System.out.println("=======================================================\n");
    }
}