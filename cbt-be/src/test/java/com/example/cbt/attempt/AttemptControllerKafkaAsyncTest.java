package com.example.cbt.attempt;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.ranking.SubmissionRankingService;
import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AttemptControllerKafkaAsyncTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @MockBean
    private KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;

    @MockBean
    private SubmissionRankingService rankingService; // This is consumed by Kafka consumer, not the controller flow.

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
        testUser = userRepository.save(User.builder().username("testuser_" + UUID.randomUUID()).password("password").role(Role.ROLE_USER).build());
        testExam = examRepository.save(Exam.builder().title("Test Exam_" + UUID.randomUUID()).durationSec(600).build());
        testAttempt = attemptRepository.save(Attempt.builder()
                .user(testUser)
                .exam(testExam)
                .startedAt(Instant.now())
                .build());
    }

    @Test
    @DisplayName("시험 제출 시, API는 즉시 응답하고 Kafka 이벤트를 발행해야 한다 (랭킹 서비스는 직접 호출하지 않음)")
    void submitAttempt_ShouldReturnImmediately_And_PublishKafkaEvent() throws Exception {
        // Given: Slow ranking service simulation
        // We don't need to simulate slowness here, we just need to verify it's not called.
        // The consumer will handle the actual call, which can be slow, but it won't affect our API response time.

        // When: Call the submit attempt API and measure time
        long startTime = System.currentTimeMillis();

        MvcResult result = mockMvc.perform(post("/api/attempts/" + testAttempt.getId() + "/submit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        long duration = System.currentTimeMillis() - startTime;

        // Then: Assert API response is fast
        System.out.println("API Response Time: " + duration + "ms");
        assertThat(duration).as("API 응답은 1초 미만이어야 합니다.").isLessThan(1000L);

        // And: Assert Kafka event was published
        // Use a timeout to give the transaction time to commit and the event to be sent.
        verify(kafkaTemplate, timeout(1000).times(1))
                .send(eq(AttemptService.TOPIC_EXAM_GRADED), any(ExamGradedEvent.class));

        // And: Assert that the slow ranking service was NOT called directly in the controller flow
        verify(rankingService, never()).increaseSubmission(any());
        verify(rankingService, never()).updateExamRanking(any(), any(), any());
    }
}
