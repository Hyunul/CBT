package com.example.cbt.attempt;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.grading.GradingService;
import com.example.cbt.ranking.SubmissionRankingService;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@Transactional
class AttemptServiceSynchronousBenchmarkTest {

    @Autowired
    private AttemptService attemptService; // Use the real service

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @MockBean
    private SubmissionRankingService rankingService; // Mock the ranking service to introduce delay

    @MockBean
    private GradingService gradingService; // Mock grading to avoid actual grading complexity and focus on ranking delay

    // Need to mock KafkaTemplate since it's now a dependency of AttemptService,
    // but we don't want it to actually send messages in this benchmark test.
    // It will be mocked to do nothing.
    @MockBean
    private org.springframework.kafka.core.KafkaTemplate<String, com.example.cbt.kafka.dto.ExamGradedEvent> kafkaTemplate;


    private User testUser;
    private Exam testExam;
    private Attempt testAttempt;

    @BeforeEach
    void setUp() {
        // Clear previous data
        attemptRepository.deleteAll();
        examRepository.deleteAll();
        userRepository.deleteAll();

        // Create test entities
        testUser = userRepository.save(User.builder().username("testuser").password("password").build());
        testExam = examRepository.save(Exam.builder().title("Test Exam").durationSec(600).build());
        testAttempt = attemptRepository.save(Attempt.builder()
                .user(testUser)
                .exam(testExam)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build());

        // Stub grading service to return a simple result quickly
        doAnswer(invocation -> {
            Attempt attemptArg = invocation.getArgument(0);
            return new com.example.cbt.grading.GradingResult(50, 10, java.util.Collections.emptyList()); // Sample score
        }).when(gradingService).gradeAttempt(any(Attempt.class));

        // Simulate a slow ranking service (2 seconds delay)
        doAnswer(invocation -> {
            Thread.sleep(2000); // Simulate 2 seconds of work
            return null;
        }).when(rankingService).increaseSubmission(any());

        doAnswer(invocation -> {
            Thread.sleep(2000); // Simulate 2 seconds of work
            return null;
        }).when(rankingService).updateExamRanking(any(), any(), any());
    }

    @Test
    @DisplayName("Kafka 미적용 시 (가정), submitAndGrade는 랭킹 업데이트 지연으로 인해 느리게 동작해야 한다.")
    void submitAndGrade_WithoutKafka_ShouldBeSlowDueToRankingUpdate() {
        // When: Call submitAndGrade directly and measure time
        long startTime = System.currentTimeMillis();
        attemptService.submitAndGrade(testAttempt.getId());
        long duration = System.currentTimeMillis() - startTime;

        // Then: Assert that the operation takes significant time
        System.out.println("Synchronous submitAndGrade duration: " + duration + "ms");
        assertThat(duration).as("동기 랭킹 업데이트로 인해 2초 이상 소요되어야 합니다.").isGreaterThanOrEqualTo(2000L);
    }
}
