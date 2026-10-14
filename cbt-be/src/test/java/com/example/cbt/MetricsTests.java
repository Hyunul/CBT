package com.example.cbt;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** 테스트에서는 지표 내보내기가 기본으로 꺼져 있어 @AutoConfigureObservability 로 켠다. */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureObservability
class MetricsTests {
  @Autowired MockMvc mvc;
  @Autowired ExamRepository exams;
  @Autowired QuestionRepository questions;

  @Test
  void prometheusExposesHttpAndAttemptMetricsWithoutLogin() throws Exception {
    Exam exam = exams.save(Exam.builder().title("지표").durationSec(600).isPublished(true).build());
    questions.save(Question.builder().exam(exam).text("1+1?").type(QuestionType.MCQ)
        .choices("{\"1\":\"2\"}").answerKey("1").score(1).build());
    mvc.perform(post("/api/attempts/start/" + exam.getId())).andExpect(status().isOk());

    String body = mvc.perform(get("/actuator/prometheus")).andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    assertTrue(body.contains("cbt_attempts_started_total{application=\"cbt\"} 1.0"), "커밋 후 업무 지표 1회");
    assertTrue(body.contains("http_server_requests_seconds_bucket"), "엔드포인트 지연 히스토그램");
  }
}
