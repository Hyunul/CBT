package com.example.cbt.attempt;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.grading.GradingService;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.ranking.SubmissionRankingService;
import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@Transactional
class AttemptServiceSynchronousBenchmarkTest {

    @TestConfiguration
    static class BenchmarkTestConfiguration {
        @Bean
        @Primary
        public SubmissionRankingService submissionRankingService() {
            return Mockito.mock(SubmissionRankingService.class);
        }

        @Bean
        @Primary
        public GradingService gradingService() {
            return Mockito.mock(GradingService.class);
        }

        @Bean
        @Primary
        @SuppressWarnings("unchecked")
        public KafkaTemplate<String, ExamGradedEvent> kafkaTemplate() {
            return Mockito.mock(KafkaTemplate.class);
        }
    }

    @Autowired
    private AttemptService attemptService; // Use the real service

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private SubmissionRankingService rankingService;

    @Autowired
    private GradingService gradingService;

    private User testUser;
    private Exam testExam;

    @BeforeEach
    void setUp() {
        // Clear previous data
        attemptRepository.deleteAll();
        examRepository.deleteAll();
        userRepository.deleteAll();

        // Create base test entities
        testUser = userRepository.save(User.builder().username("testuser_" + UUID.randomUUID()).password("password").role(Role.ROLE_USER).build());
        testExam = examRepository.save(Exam.builder().title("Test Exam_" + UUID.randomUUID()).durationSec(600).build());

        // Stub grading service for all tests
        doAnswer(invocation -> new com.example.cbt.grading.GradingResult(50, 10, Collections.emptyList()))
                .when(gradingService).gradeAttempt(any(Attempt.class));
    }

    @Test
    @DisplayName("Kafka 미적용 시 (가정), submitAndGrade는 랭킹 업데이트 지연으로 인해 느리게 동작해야 한다.")
    void submitAndGrade_WithoutKafka_ShouldBeSlowDueToRankingUpdate() throws InterruptedException {
        // Given: A single attempt and a slow ranking service
        Attempt testAttempt = attemptRepository.save(Attempt.builder()
                .user(testUser)
                .exam(testExam)
                .startedAt(Instant.now())
                .build());

        // Simulate a slow ranking service (2 seconds delay)
        doAnswer(invocation -> {
            Thread.sleep(2000); // Simulate 2 seconds of work
            return null;
        }).when(rankingService).increaseSubmission(any());
        doAnswer(invocation -> {
            Thread.sleep(2000); // Simulate 2 seconds of work
            return null;
        }).when(rankingService).updateExamRanking(any(), any(), any());

        // When: Call submitAndGrade directly and measure time
        long startTime = System.currentTimeMillis();
        attemptService.submitAndGrade(testAttempt.getId(), testUser.getId());
        long duration = System.currentTimeMillis() - startTime;

        // Then: Assert that the operation takes significant time
        System.out.println("Synchronous submitAndGrade duration: " + duration + "ms");
        assertThat(duration).as("동기 랭킹 업데이트로 인해 2초 이상 소요되어야 합니다.").isGreaterThanOrEqualTo(2000L);
    }

    @Test
    @DisplayName("로컬 환경을 위한 기본 부하 테스트: 5명의 동시 사용자가 각각 10번씩 제출")
    void submitAndGrade_LoadTest() throws InterruptedException {
        // Given: Test parameters for a local load test
        final int CONCURRENT_USERS = 5;
        final int REQUESTS_PER_USER = 10;
        final int totalSubmissions = CONCURRENT_USERS * REQUESTS_PER_USER;
        var executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        var latch = new CountDownLatch(totalSubmissions);

        System.out.printf("부하 테스트 시작: %d명의 동시 사용자가 %d번씩 요청 (총 %d회 제출)%n", CONCURRENT_USERS, REQUESTS_PER_USER, totalSubmissions);

        // When: Simulate concurrent submissions and measure total time
        long startTime = System.currentTimeMillis();

        IntStream.range(0, totalSubmissions).forEach(i -> {
            executor.submit(() -> {
                try {
                    // Each thread creates its own attempt to avoid race conditions
                    Attempt attempt = attemptRepository.save(Attempt.builder()
                            .user(testUser)
                            .exam(testExam)
                            .startedAt(Instant.now())
                            .build());
                    attemptService.submitAndGrade(attempt.getId(), testUser.getId());
                } finally {
                    latch.countDown();
                }
            });
        });

        // Wait for all submissions to complete
        latch.await(5, TimeUnit.MINUTES); // Set a generous timeout
        long duration = System.currentTimeMillis() - startTime;

        // Then: Print results
        System.out.printf("부하 테스트 완료. 총 소요 시간: %d ms%n", duration);
        System.out.printf("초당 처리량 (TPS): %.2f%n", totalSubmissions / (duration / 1000.0));

        // Cleanup
        executor.shutdown();
        assertThat(latch.getCount()).as("모든 제출이 시간 내에 완료되어야 합니다.").isZero();
    }
}
