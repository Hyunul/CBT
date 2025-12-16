package com.example.cbt.benchmark;

import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.attempt.AttemptService;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Answer;
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

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
public class KafkaVsSyncBenchmarkTest {

    @Autowired
    private AttemptService attemptService;
    @Autowired
    private AttemptRepository attemptRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private AnswerRepository answerRepository;

    @MockBean
    private GradingService gradingService;

    @MockBean
    private KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;

    private Exam testExam;
    private List<User> testUsers;
    private List<Question> testQuestions;

    // Configuration
    private static final int USER_COUNT = 200; 
    private static final int RANKING_DELAY_MS = 50; // Simulate 50ms latency for DB-heavy ranking update
    private static final int KAFKA_NETWORK_DELAY_MS = 5; // Simulate 5ms to send message to broker
    private static final String REPORT_FILE = "kafka_vs_sync_report.html";

    @BeforeEach
    void setUp() {
        // Cleanup
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        userRepository.deleteAll();
        questionRepository.deleteAll();
        examRepository.deleteAll();

        // 1. Setup Data
        testExam = examRepository.save(Exam.builder().title("Benchmark Exam").durationSec(3600).build());
        
        testQuestions = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            testQuestions.add(Question.builder().exam(testExam).text("Q"+i).type(QuestionType.MCQ).choices("A,B").answerKey("A").score(20).build());
        }
        questionRepository.saveAll(testQuestions);

        testUsers = new ArrayList<>();
        for (int i = 0; i < USER_COUNT; i++) {
            testUsers.add(User.builder()
                    .username("u" + i)
                    .email("u" + i + "@t.co")
                    .password("password")
                    .role(Role.ROLE_USER)
                    .build());
        }
        userRepository.saveAll(testUsers);

        // 2. Mock Grading Service (Fast CPU operation)
        when(gradingService.gradeAttempt(any(Attempt.class)))
            .thenReturn(new GradingResult(100, 5, Collections.emptyList()));
    }
    
    @AfterEach
    void tearDown() {
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        userRepository.deleteAll();
        questionRepository.deleteAll();
        examRepository.deleteAll();
    }

    @Test
    @DisplayName("Compare Sync vs Async Throughput")
    void comparePerformance() throws InterruptedException, IOException {
        System.out.println("Starting Benchmark with " + USER_COUNT + " concurrent users...");

        // --- Phase 1: Without Kafka (Simulated Sync) ---
        // Mock Kafka to be instant (no-op) so it doesn't add time
        when(kafkaTemplate.send(any(), any())).thenReturn(CompletableFuture.completedFuture(null));
        
        System.out.println("Running Phase 1: Synchronous Simulation...");
        List<Long> syncLatencies = runBenchmarkPhase(true);
        double syncAvg = syncLatencies.stream().mapToLong(l -> l).average().orElse(0);
        long syncTotalTime = syncLatencies.stream().mapToLong(l -> l).sum(); // Approximate sum, or we can use wall clock
        
        // --- Phase 2: With Kafka (Async) ---
        // Cleanup attempts for round 2
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        
        // Mock Kafka to have network delay
        when(kafkaTemplate.send(any(), any())).thenAnswer(inv -> {
            try { Thread.sleep(KAFKA_NETWORK_DELAY_MS); } catch (InterruptedException e) {}
            return CompletableFuture.completedFuture(null);
        });

        System.out.println("Running Phase 2: Asynchronous (Kafka) Simulation...");
        List<Long> asyncLatencies = runBenchmarkPhase(false);
        double asyncAvg = asyncLatencies.stream().mapToLong(l -> l).average().orElse(0);

        generateHtmlReport(syncLatencies, asyncLatencies);
    }

    private List<Long> runBenchmarkPhase(boolean isSyncMode) throws InterruptedException {
        // Pre-create attempts
        List<Attempt> attempts = testUsers.stream().map(u -> {
            Attempt att = attemptService.startAttempt(testExam.getId(), u.getId());
            return att;
        }).collect(Collectors.toList());

        ExecutorService executor = Executors.newFixedThreadPool(50); // 50 Threads for 200 users
        List<CompletableFuture<Long>> futures = new ArrayList<>();

        long startWallClock = System.currentTimeMillis();

        for (Attempt attempt : attempts) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                long start = System.currentTimeMillis();
                try {
                    // 1. Call Service
                    attemptService.submitAndGrade(attempt.getId(), attempt.getUser().getId());
                    
                    // 2. If Sync Mode, simulate the Ranking Update blocking the thread
                    if (isSyncMode) {
                        try { Thread.sleep(RANKING_DELAY_MS); } catch (InterruptedException e) {}
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return System.currentTimeMillis() - start;
            }, executor));
        }

        executor.shutdown();
        executor.awaitTermination(2, TimeUnit.MINUTES);
        
        return futures.stream().map(CompletableFuture::join).collect(Collectors.toList());
    }

    private void generateHtmlReport(List<Long> syncLatencies, List<Long> asyncLatencies) throws IOException {
        double syncAvg = syncLatencies.stream().mapToLong(Long::longValue).average().orElse(0);
        double asyncAvg = asyncLatencies.stream().mapToLong(Long::longValue).average().orElse(0);
        
        // Calculate percentiles
        Collections.sort(syncLatencies);
        Collections.sort(asyncLatencies);
        long syncP95 = syncLatencies.get((int)(syncLatencies.size() * 0.95));
        long asyncP95 = asyncLatencies.get((int)(asyncLatencies.size() * 0.95));

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kafka Performance Impact Analysis</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
                    .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
                    h1 { color: #333; }
                    .highlight { color: #2ecc71; font-weight: bold; }
                    table { width: 100%%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
                    th { background-color: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Kafka vs Synchronous Processing Benchmark</h1>
                    <p>Comparison of User Perceived Latency during Exam Submission.</p>
                    <ul>
                        <li><strong>Concurrent Users:</strong> %d</li>
                        <li><strong>Simulated Ranking Overhead (Sync):</strong> %d ms</li>
                        <li><strong>Simulated Kafka Overhead (Async):</strong> %d ms</li>
                    </ul>
                </div>

                <div class="card">
                    <h2>Key Findings</h2>
                    <p>Average Latency reduced by <span class="highlight">%.1f%%</span> using Kafka.</p>
                    <table>
                        <tr>
                            <th>Metric</th>
                            <th>Synchronous (No Kafka)</th>
                            <th>Asynchronous (With Kafka)</th>
                        </tr>
                        <tr>
                            <td>Average Latency</td>
                            <td>%.2f ms</td>
                            <td>%.2f ms</td>
                        </tr>
                         <tr>
                            <td>95th Percentile (P95)</td>
                            <td>%d ms</td>
                            <td>%d ms</td>
                        </tr>
                    </table>
                </div>

                <div class="card">
                    <canvas id="chart"></canvas>
                </div>

                <script>
                    const ctx = document.getElementById('chart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: Array.from({length: %d}, (_, i) => i + 1),
                            datasets: [
                                {
                                    label: 'Synchronous (Blocking)',
                                    data: %s,
                                    borderColor: '#e74c3c',
                                    tension: 0.1,
                                    fill: false
                                },
                                {
                                    label: 'Asynchronous (Kafka)',
                                    data: %s,
                                    borderColor: '#2ecc71',
                                    tension: 0.1,
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { display: true, text: 'Latency per Request (Lower is Better)' }
                            },
                            scales: {
                                y: { title: { display: true, text: 'Response Time (ms)' }, beginAtZero: true }
                            }
                        }
                    });
                </script>
            </body>
            </html>
        """.formatted(
            USER_COUNT, RANKING_DELAY_MS, KAFKA_NETWORK_DELAY_MS,
            ((syncAvg - asyncAvg) / syncAvg) * 100.0,
            syncAvg, asyncAvg,
            syncP95, asyncP95,
            USER_COUNT,
            syncLatencies.toString(),
            asyncLatencies.toString()
        );

        try (FileWriter writer = new FileWriter(new File(REPORT_FILE))) {
            writer.write(html);
            System.out.println("Report generated: " + new File(REPORT_FILE).getAbsolutePath());
        }
    }
}
