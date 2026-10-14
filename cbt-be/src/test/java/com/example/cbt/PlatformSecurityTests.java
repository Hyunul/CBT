package com.example.cbt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.cbt.attempt.*;
import com.example.cbt.auth.*;
import com.example.cbt.exam.*;
import com.example.cbt.question.*;
import com.example.cbt.user.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "springdoc.api-docs.enabled=true")
@AutoConfigureMockMvc
class PlatformSecurityTests {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired ExamRepository exams;
  @Autowired QuestionRepository questions;
  @Autowired AttemptRepository attempts;
  @Autowired AnswerRepository answers;
  @Autowired com.example.cbt.exam.series.ExamSeriesRepository seriesRepo;
  @Autowired JwtUtil jwt;
  @MockitoBean AuthService auth;
  Exam exam;
  Question question;

  @BeforeEach
  void setup() {
    answers.deleteAll();
    attempts.deleteAll();
    questions.deleteAll();
    exams.deleteAll();
    users.deleteAll();
    exam = exams.save(Exam.builder().title("Test").durationSec(600).isPublished(true).build());
    question =
        questions.save(
            Question.builder()
                .exam(exam)
                .text("1+1?")
                .type(QuestionType.MCQ)
                .choices("{\"1\":\"2\",\"2\":\"3\"}")
                .answerKey("1")
                .score(10)
                .build());
  }

  record Guest(long id, String key) {}

  Guest start() throws Exception {
    var res =
        mvc.perform(post("/api/attempts/start/" + exam.getId()))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse();
    return new Guest(Long.parseLong(res.getContentAsString()), res.getHeader("X-Attempt-Key"));
  }

  String payload() {
    return "[{\"questionId\":" + question.getId() + ",\"selectedChoices\":\"1\"}]";
  }

  @Test
  void apiDocumentationCanBeGenerated() throws Exception {
    mvc.perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/auth/login']").exists());
  }

  @Test
  void signupCannotCreateAdmin() throws Exception {
    mvc.perform(
            post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"email\":\"tester@example.com\",\"username\":\"tester\",\"password\":\"password123\",\"role\":\"ROLE_ADMIN\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.role").value("ROLE_USER"));
  }

  @Test
  void seriesMutationsRequireAdmin() throws Exception {
    mvc.perform(
            post("/api/series").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(delete("/api/series/1?force=true")).andExpect(status().isUnauthorized());
    User user = users.save(User.builder().username("user").role(Role.ROLE_USER).build());
    when(auth.isActive(eq(user.getId()), anyString())).thenReturn(true);
    String token = jwt.generateToken(user.getId(), user.getUsername(), "ROLE_USER", "session");
    mvc.perform(
            put("/api/series/1")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"x\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void refreshTokenIsNotAnAccessToken() throws Exception {
    User user = users.save(User.builder().username("user").role(Role.ROLE_USER).build());
    when(auth.isActive(anyLong(), anyString())).thenReturn(true);
    mvc.perform(
            get("/api/attempts/history")
                .header(
                    "Authorization", "Bearer " + jwt.generateRefreshToken(user.getId(), "session")))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void historyIncludesAllStatesWithPaginationAndOnlyOwnMemberAttempts() throws Exception {
    User user = users.save(User.builder().username("history-user").role(Role.ROLE_USER).build());
    User other = users.save(User.builder().username("other-user").role(Role.ROLE_USER).build());
    when(auth.isActive(eq(user.getId()), anyString())).thenReturn(true);
    String token = jwt.generateToken(user.getId(), user.getUsername(), "ROLE_USER", "session");
    Instant now = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    Attempt graded = historyAttempt(user, now.minusSeconds(1200), 600, now.minusSeconds(900));
    Attempt expired = historyAttempt(user, now.minusSeconds(300), 60, null);
    Attempt progress = historyAttempt(user, now.minusSeconds(60), 600, null);
    historyAttempt(other, now, 600, null);
    historyAttempt(null, now, 600, null);

    mvc.perform(get("/api/attempts/history?size=2").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.totalPages").value(2))
        .andExpect(jsonPath("$.content.length()").value(2))
        .andExpect(jsonPath("$.content[0].attemptId").value(progress.getId()))
        .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"))
        .andExpect(jsonPath("$.content[0].finalScore").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.content[0].submissionDate").value(progress.getStartedAt().toString()))
        .andExpect(jsonPath("$.content[1].attemptId").value(expired.getId()))
        .andExpect(jsonPath("$.content[1].status").value("EXPIRED"))
        .andExpect(jsonPath("$.content[1].finalScore").value(org.hamcrest.Matchers.nullValue()))
        .andExpect(jsonPath("$.content[1].submissionDate").value(expired.getStartedAt().toString()));
    mvc.perform(get("/api/attempts/history?size=2&page=1").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(3))
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.content[0].attemptId").value(graded.getId()))
        .andExpect(jsonPath("$.content[0].status").value("GRADED"))
        .andExpect(jsonPath("$.content[0].finalScore").value(80))
        .andExpect(jsonPath("$.content[0].submissionDate").value(graded.getSubmittedAt().toString()));
    assertNull(attempts.findById(expired.getId()).orElseThrow().getSubmittedAt());
    mvc.perform(get("/api/attempts/history")).andExpect(status().isUnauthorized());
  }

  @Test
  void historyUsesAttemptDurationFirstAndExamDurationForLegacyAttempts() throws Exception {
    User user = users.save(User.builder().username("duration-user").role(Role.ROLE_USER).build());
    when(auth.isActive(eq(user.getId()), anyString())).thenReturn(true);
    String token = jwt.generateToken(user.getId(), user.getUsername(), "ROLE_USER", "session");
    Instant now = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    Attempt snapshot = historyAttempt(user, now.minusSeconds(700), 1200, null);
    Attempt legacyProgress = historyAttempt(user, now.minusSeconds(300), null, null);
    Attempt legacyExpired = historyAttempt(user, now.minusSeconds(800), null, null);
    mvc.perform(get("/api/attempts/history").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].attemptId").value(legacyProgress.getId()))
        .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"))
        .andExpect(jsonPath("$.content[1].attemptId").value(snapshot.getId()))
        .andExpect(jsonPath("$.content[1].status").value("IN_PROGRESS"))
        .andExpect(jsonPath("$.content[2].attemptId").value(legacyExpired.getId()))
        .andExpect(jsonPath("$.content[2].status").value("EXPIRED"));
  }

  private Attempt historyAttempt(User user, Instant startedAt, Integer duration, Instant submittedAt) {
    Attempt attempt =
        attempts.save(
            Attempt.builder()
                .exam(exam)
                .user(user)
                .durationSec(duration)
                .submittedAt(submittedAt)
                .totalScore(80)
                .build());
    // Update after insertion because @CreationTimestamp supplies the initial start time.
    attempt.setStartedAt(startedAt.truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
    return attempts.save(attempt);
  }

  @Test
  void revokedAccessTokenIsRejected() throws Exception {
    User user = users.save(User.builder().username("user").role(Role.ROLE_USER).build());
    mvc.perform(
            get("/api/attempts/history")
                .header(
                    "Authorization",
                    "Bearer " + jwt.generateToken(user.getId(), "user", "ROLE_USER", "revoked")))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void guestCannotReadOrChangeAnotherAttempt() throws Exception {
    Guest a = start();
    mvc.perform(get("/api/attempts/" + a.id)).andExpect(status().isForbidden());
    mvc.perform(
            post("/api/attempts/" + a.id + "/answers")
                .header("X-Attempt-Key", "wrong")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload()))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/attempts/" + a.id).header("X-Attempt-Key", a.key))
        .andExpect(status().isOk());
  }

  @Test
  void inProgressAttemptHidesAnswer() throws Exception {
    Guest a = start();
    mvc.perform(get("/api/attempts/" + a.id).header("X-Attempt-Key", a.key))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.questions[0].correctAnswer").doesNotExist());
  }

  @Test
  void studyRevealsAnswersOnlyForPracticalExams() throws Exception {
    mvc.perform(get("/api/exams/" + exam.getId() + "/study")).andExpect(status().isNotFound());
    // 분리된 exam(questions=null)을 save하면 orphanRemoval로 문항이 지워지므로 다시 읽는다.
    exam = exams.findById(exam.getId()).orElseThrow();
    exam.setType(ExamType.PRACTICAL);
    exams.save(exam);
    mvc.perform(get("/api/exams/" + exam.getId() + "/study"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].correctAnswer").value("1"));
    mvc.perform(post("/api/attempts/start/" + exam.getId())).andExpect(status().isConflict());
    exam.setPublished(false);
    exams.save(exam);
    mvc.perform(get("/api/exams/" + exam.getId() + "/study")).andExpect(status().isNotFound());
  }

  @Test
  void seriesRankingCountsSubmittedWrittenAttemptsOnly() throws Exception {
    var written = seriesRepo.save(com.example.cbt.exam.series.ExamSeries.builder().name("필기 종목").build());
    var practical = seriesRepo.save(com.example.cbt.exam.series.ExamSeries.builder().name("실기 종목").build());
    exam.setSeries(written);
    exams.save(exam);
    Exam study =
        exams.save(
            Exam.builder().title("실기").durationSec(600).isPublished(true).series(practical)
                .type(ExamType.PRACTICAL).build());
    Instant now = Instant.now();
    attempts.save(Attempt.builder().exam(exam).submittedAt(now).build()); // 비회원 제출도 센다
    attempts.save(Attempt.builder().exam(exam).submittedAt(now).build());
    attempts.save(Attempt.builder().exam(exam).build()); // 제출 안 함
    attempts.save(Attempt.builder().exam(study).submittedAt(now).build()); // 실기는 세지 않는다
    mvc.perform(get("/api/ranking/series"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].rank").value(1))
        .andExpect(jsonPath("$[0].seriesName").value("필기 종목"))
        .andExpect(jsonPath("$[0].solvedCount").value(2));
    mvc.perform(get("/api/ranking/exam/" + exam.getId())).andExpect(status().isNotFound());
  }

  @Test
  void unpublishedExamIsHidden() throws Exception {
    exam.setPublished(false);
    exams.save(exam);
    mvc.perform(get("/api/exams/" + exam.getId())).andExpect(status().isNotFound());
    mvc.perform(get("/api/exams/" + exam.getId() + "/questions")).andExpect(status().isNotFound());
    mvc.perform(get("/api/exams")).andExpect(jsonPath("$.data.length()").value(0));
    mvc.perform(post("/api/attempts/start/" + exam.getId())).andExpect(status().isNotFound());
  }

  @Test
  void answersAreRestoredAndResultRequiresSubmission() throws Exception {
    Guest a = start();
    mvc.perform(get("/api/attempts/" + a.id + "/result").header("X-Attempt-Key", a.key))
        .andExpect(status().isConflict());
    mvc.perform(
            post("/api/attempts/" + a.id + "/answers")
                .header("X-Attempt-Key", a.key)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/attempts/" + a.id).header("X-Attempt-Key", a.key))
        .andExpect(jsonPath("$.answers[0].selectedChoices").value("1"));
    mvc.perform(get("/api/attempts/" + a.id + "/result").header("X-Attempt-Key", a.key))
        .andExpect(status().isConflict());
  }

  @Test
  void submissionIsIdempotentAndCountsUnansweredQuestions() throws Exception {
    questions.save(
        Question.builder()
            .exam(exam)
            .text("other")
            .type(QuestionType.MCQ)
            .answerKey("1")
            .score(5)
            .build());
    Guest a = start();
    for (int i = 0; i < 2; i++)
      mvc.perform(
              post("/api/attempts/" + a.id + "/submit")
                  .header("X-Attempt-Key", a.key)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(payload()))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.questionCount").value(2))
          .andExpect(jsonPath("$.wrongCount").value(1))
          .andExpect(jsonPath("$.totalScore").value(10));
    assertEquals(1, answers.findByAttemptId(a.id).size());
    mvc.perform(
            post("/api/attempts/" + a.id + "/answers")
                .header("X-Attempt-Key", a.key)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload()))
        .andExpect(status().isConflict());
    mvc.perform(get("/api/attempts/" + a.id + "/result").header("X-Attempt-Key", a.key))
        .andExpect(status().isOk());
  }

  @Test
  void deadlineRejectsLateAnswersButAllowsGrading() throws Exception {
    Guest a = start();
    Attempt attempt = attempts.findById(a.id).orElseThrow();
    attempt.setStartedAt(Instant.now().minusSeconds(1000));
    attempts.save(attempt);
    mvc.perform(
            post("/api/attempts/" + a.id + "/answers")
                .header("X-Attempt-Key", a.key)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload()))
        .andExpect(status().isConflict());
    mvc.perform(
            post("/api/attempts/" + a.id + "/submit")
                .header("X-Attempt-Key", a.key)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalScore").value(0));
  }

  @Test
  void questionEditsAreBlockedDuringAnAttempt() throws Exception {
    start();
    User admin = users.save(User.builder().username("admin").role(Role.ROLE_ADMIN).build());
    when(auth.isActive(eq(admin.getId()), anyString())).thenReturn(true);
    mvc.perform(
            put("/api/exams/" + exam.getId() + "/questions")
                .header(
                    "Authorization",
                    "Bearer " + jwt.generateToken(admin.getId(), "admin", "ROLE_ADMIN", "session"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"questions\":[]}"))
        .andExpect(status().isConflict());
  }
}
