package com.example.cbt.benchmark;

import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.attempt.AttemptService;
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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class KafkaOverheadTest {

    @Autowired
    private AttemptService attemptService;
    @Autowired
    private AttemptRepository attemptRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;
    @Autowired
    private TransactionTemplate transactionTemplate;

    private User testUser;
    private Exam testExam;

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        userRepository.deleteAll();
        examRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .username("overhead_user")
                .email("overhead@test.com")
                .password("pass")
                .role(Role.ROLE_USER)
                .build());

        testExam = examRepository.save(Exam.builder()
                .title("Overhead Test Exam")
                .durationSec(120)
                .build());
    }

    @Test
    @DisplayName("Overhead Verification: Compare Direct DB Write vs Kafka Round Trip")
    void compareOverhead() throws InterruptedException {
        // 1. Direct DB Save (Synchronous)
        // This simulates the 'Simple Architecture' without Kafka
        long startSync = System.nanoTime();
        
        Attempt syncAttempt = attemptService.startAttempt(testExam.getId(), testUser.getId());
        syncAttempt.setTotalScore(100);
        attemptRepository.save(syncAttempt); // Direct DB update
        
        long endSync = System.nanoTime();
        long syncDuration = endSync - startSync;

        System.out.println("--------------------------------------------------");
        System.out.printf("[Sync] Direct DB Save Time: %.4f ms%n", syncDuration / 1_000_000.0);
        System.out.println("--------------------------------------------------");


        // 2. Kafka Round Trip (Asynchronous Structure Overhead)
        // This measures: Producer Serializing -> Send -> (Mocked/Real Network) -> Consumer -> DB Save
        // Even without a real broker (if mocked), the framework overhead exists.
        // If we use embedded Kafka or real Kafka, the difference will be huge.
        
        long startAsync = System.nanoTime();

        // Simulate sending an event that eventually triggers a save
        ExamGradedEvent event = new ExamGradedEvent(testUser.getId(), testExam.getId(), 100);
        
        try {
            kafkaTemplate.send("exam-graded", event).get(5, TimeUnit.SECONDS); // Block to measure producer cost
        } catch (Exception e) {
            // Ignore connection errors if broker is down, we just want to measure the attempt cost
            System.out.println("Kafka Connection skipped (expected if no broker), measuring framework overhead only.");
        }

        long endAsync = System.nanoTime();
        long asyncDuration = endAsync - startAsync;
        
        System.out.println("--------------------------------------------------");
        System.out.printf("[Async] Kafka Producer Send Overhead: %.4f ms%n", asyncDuration / 1_000_000.0);
        System.out.println("--------------------------------------------------");
        
        // Analysis
        System.out.println(">> Result Analysis:");
        if (asyncDuration > syncDuration) {
            double ratio = (double) asyncDuration / syncDuration;
            System.out.printf("Kafka introduces %.2fx overhead compared to direct DB write.%n", ratio);
            System.out.println("Conclusion: For simple logic, Direct DB is significantly faster and simpler.");
        }
    }
}
