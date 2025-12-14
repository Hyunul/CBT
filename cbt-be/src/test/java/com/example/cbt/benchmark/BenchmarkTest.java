package com.example.cbt.benchmark;

import com.example.cbt.attempt.*;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.grading.GradingResult;
import com.example.cbt.grading.GradingService;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;
import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Benchmark test to compare Synchronous grading vs Asynchronous (simulated) grading.
 * This test generates an HTML report "benchmark_report.html" in the project root.
 */
@SpringBootTest
@ActiveProfiles("test")
public class BenchmarkTest {

    @Autowired
    private AttemptRepository attemptRepository;
    @Autowired
    private AnswerRepository answerRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private GradingService gradingService;

    // We mock Kafka to simulate the async behavior without needing a real broker for this specific micro-benchmark
    // or to strictly control the "send" time.
    @MockBean
    private KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;

    // Service under test (we might need to spy on it or use it directly)
    @Autowired
    private AttemptService attemptService;

    private Exam testExam;
    private List<User> testUsers;
    private List<Question> testQuestions;

    private static final int USER_COUNT = 100; // Number of concurrent users
    private static final String REPORT_FILE = "benchmark_report.html";

    @BeforeEach
    void setUp() {
        // cleanup
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        userRepository.deleteAll();
        questionRepository.deleteAll();
        examRepository.deleteAll();

        // 1. Create Exam
        testExam = examRepository.save(Exam.builder()
                .title("Benchmark Exam")
                .durationSec(3600)
                .build());

        // 2. Create Questions
        testQuestions = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            testQuestions.add(Question.builder()
                    .exam(testExam)
                    .text("Question " + i)
                    .type(QuestionType.MCQ)
                    .choices("A,B,C,D")
                    .answerKey("A")
                    .score(10)
                    .build());
        }
        questionRepository.saveAll(testQuestions);

        // 3. Create Users
        testUsers = new ArrayList<>();
        for (int i = 0; i < USER_COUNT; i++) {
            testUsers.add(User.builder()
                    .username("user" + i + "_" + UUID.randomUUID())
                    .email("user" + i + "@test.com")
                    .password("pass")
                    .role(Role.ROLE_USER)
                    .build());
        }
        userRepository.saveAll(testUsers);
    }
    
    @AfterEach
    void tearDown() {
        // cleanup
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        userRepository.deleteAll();
        questionRepository.deleteAll();
        examRepository.deleteAll();
    }

    @Test
    @DisplayName("Run Benchmark: Case 1 (Sync) vs Case 2 (Async-Simulated)")
    void runBenchmark() throws Exception {
        // --- Case 1: Synchronous Processing ---
        // In the current service, submitAndGrade does grading AND DB saves in the main thread.
        // The Kafka part is just a fire-and-forget notification at the end.
        // So the current 'submitAndGrade' IS effectively the "Heavy" synchronous operation minus the final ranking calc.
        // To simulate "Sync" fully including ranking, we can assume the Kafka send is instantaneous but grading is the cost.
        
        long syncStartTime = System.currentTimeMillis();
        List<Long> syncLatencies = runConcurrentSubmissions(false);
        long syncEndTime = System.currentTimeMillis();
        long syncTotalTime = syncEndTime - syncStartTime;

        // --- Case 2: Asynchronous Processing (Simulated) ---
        // To simulate a "pure" async architecture where the HTTP response returns IMMEDIATELY after acknowledging receipt,
        // and grading happens in background:
        // We will modify the behavior slightly for the test or assume a hypothetical method 'submitAsync'.
        // Since we can't change the Service code easily for a test without strategy pattern, 
        // we will measure the time it takes JUST to "load" the request (simulating a quick controller return)
        // vs the actual processing time.
        //
        // However, the user wants "Case 1: Light Load/Sync-like" vs "Case 2: Kafka applied".
        // The current code ALREADY sends to Kafka. 
        //
        // Interpretation:
        // Case 1 (Sync grading): The current 'submitAndGrade' calls 'gradingService.gradeAttempt' (CPU bound) + DB saves.
        // This blocks the HTTP thread.
        //
        // Case 2 (Async architecture target): Ideally, the Controller should just produce a message "AttemptSubmitted" to Kafka
        // and return "Pending". The Consumer would then grade it. 
        //
        // Since the current code is: Controller -> Service -> Grade(Sync) -> Save -> Kafka(Ranking),
        // The "Heavy" part (Grading) is already Sync. 
        //
        // Let's create a hypothetical comparison:
        // 1. "Full Sync": Grading + Ranking (simulated by adding a sleep to represent synchronous ranking update).
        // 2. "Async Ranking": Grading (Sync) + Kafka (Async Ranking). (This is the CURRENT implementation).
        
        // Let's refine based on "Light burden" vs "Kafka".
        // Maybe Case 1 is: Just Grading (Sync).
        // Case 2 is: Grading + Kafka send (Async). 
        // This tests the OVERHEAD of Kafka.
        
        // Wait, "Case 1: Local DB/Server light burden" and "Case 2: Kafka applied".
        // This implies Case 1 should NOT use Kafka.
        // Case 2 SHOULD use Kafka.
        
        // Re-setup for Case 2
        setUp(); 
        
        // Mock Kafka to simulate network delay or just overhead
        when(kafkaTemplate.send(any(), any())).thenAnswer(invocation -> {
             Thread.sleep(5); // Simulate network round-trip to broker
             return CompletableFuture.completedFuture(null);
        });

        long asyncStartTime = System.currentTimeMillis();
        List<Long> asyncLatencies = runConcurrentSubmissions(true); // True = enable Kafka (simulated via service call)
        long asyncEndTime = System.currentTimeMillis();
        long asyncTotalTime = asyncEndTime - asyncStartTime;
        
        generateReport(syncLatencies, syncTotalTime, asyncLatencies, asyncTotalTime);
    }

    private List<Long> runConcurrentSubmissions(boolean useKafka) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(20); // Simulating 20 concurrent threads serving 100 users
        List<CompletableFuture<Long>> futures = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger(0);
        
        // Pre-create attempts to just measure submission time
        List<Long> attemptIds = testUsers.stream().map(u -> {
            Attempt att = attemptService.startAttempt(testExam.getId(), u.getId());
            // Pre-save some answers
            List<Answer> answers = testQuestions.stream().map(q -> Answer.builder()
                .attempt(att)
                .question(q)
                .selectedChoices("A") // Correct answer
                .build()).collect(Collectors.toList());
            answerRepository.saveAll(answers);
            return att.getId();
        }).toList();

        // If we want to skip Kafka for Case 1, we need to mock it to do nothing or throw exception if called?
        // Or we rely on the Service logic. The service ALWAYS calls Kafka if user != null.
        // So for Case 1 (No Kafka), we mock KafkaTemplate to do nothing instantly.
        if (!useKafka) {
             when(kafkaTemplate.send(any(), any())).thenReturn(CompletableFuture.completedFuture(null));
        }

        for (Long attemptId : attemptIds) {
            CompletableFuture<Long> future = CompletableFuture.supplyAsync(() -> {
                long start = System.currentTimeMillis();
                try {
                    // This method includes Grading (Sync) + DB Save + Kafka Send (Mocked)
                    attemptService.submitAndGrade(attemptId);
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return System.currentTimeMillis() - start;
            }, executor);
            futures.add(future);
        }

        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);

        return futures.stream().map(CompletableFuture::join).collect(Collectors.toList());
    }

    private void generateReport(List<Long> latencies1, long time1, List<Long> latencies2, long time2) {
        double avg1 = latencies1.stream().mapToLong(Long::longValue).average().orElse(0.0);
        double avg2 = latencies2.stream().mapToLong(Long::longValue).average().orElse(0.0);
        
        String html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Benchmark Results</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; }
                .stats { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Performance Benchmark Report</h1>
                <p><strong>Environment:</strong> Local (Integrated Test)</p>
                <p><strong>Scenario:</strong> 100 Concurrent Exam Submissions (Grade + Save)</p>
                
                <div class="stats">
                    <h2>Summary</h2>
                    <table border="1" cellpadding="5" cellspacing="0">
                        <tr>
                            <th>Metric</th>
                            <th>Case 1: Light/No-Kafka (Simulated)</th>
                            <th>Case 2: Kafka Enabled (Simulated 5ms Latency)</th>
                        </tr>
                        <tr>
                            <td>Total Time (ms)</td>
                            <td>%d</td>
                            <td>%d</td>
                        </tr>
                        <tr>
                            <td>Avg Latency (ms)</td>
                            <td>%.2f</td>
                            <td>%.2f</td>
                        </tr>
                        <tr>
                            <td>Throughput (req/sec)</td>
                            <td>%.2f</td>
                            <td>%.2f</td>
                        </tr>
                    </table>
                </div>

                <canvas id="latencyChart"></canvas>
                
                <script>
                    const ctx = document.getElementById('latencyChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: Array.from({length: %d}, (_, i) => i + 1),
                            datasets: [{
                                label: 'Case 1 (No Kafka)',
                                data: %s,
                                borderColor: 'blue',
                                fill: false
                            }, {
                                label: 'Case 2 (With Kafka)',
                                data: %s,
                                borderColor: 'red',
                                fill: false
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { display: true, text: 'Request Latency Distribution' }
                            },
                            scales: {
                                y: { title: { display: true, text: 'Latency (ms)' } },
                                x: { title: { display: true, text: 'Request Sequence' } }
                            }
                        }
                    });
                </script>
            </div>
        </body>
        </html>
        """.formatted(
                time1, time2,
                avg1, avg2,
                (double) USER_COUNT / (time1 / 1000.0), (double) USER_COUNT / (time2 / 1000.0),
                USER_COUNT,
                latencies1.toString(),
                latencies2.toString()
        );

        try (FileWriter writer = new FileWriter(new File(REPORT_FILE))) {
            writer.write(html);
            System.out.println("Report generated at: " + new File(REPORT_FILE).getAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
