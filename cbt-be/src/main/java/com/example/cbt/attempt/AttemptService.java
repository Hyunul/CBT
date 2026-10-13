package com.example.cbt.attempt;

import com.example.cbt.attempt.dto.*;
import com.example.cbt.exam.*;
import com.example.cbt.grading.*;
import com.example.cbt.question.*;
import com.example.cbt.user.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AttemptService {
  private final AttemptRepository attempts;
  private final AnswerRepository answers;
  private final ExamRepository exams;
  private final QuestionRepository questions;
  private final UserRepository users;
  private final GradingService grading;

  @Transactional
  public Attempt startAttempt(Long examId, Long userId, String guestToken) {
    Exam exam = exams.findLockedById(examId).orElseThrow();
    if (!exam.isPublished())
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공개된 시험이 아닙니다.");
    if (exam.getType() == ExamType.PRACTICAL)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "실기 시험은 모의고사를 지원하지 않습니다.");
    if (questions.findByExamId(examId).isEmpty()) throw new IllegalStateException("문항이 없습니다.");
    return attempts.save(
        Attempt.builder()
            .exam(exam)
            .user(userId == null ? null : users.findById(userId).orElseThrow())
            .guestTokenHash(userId == null ? hash(guestToken) : null)
            .durationSec(exam.getDurationSec())
            .startedAt(Instant.now())
            .build());
  }

  @Transactional(readOnly = true)
  public AttemptDetailRes getAttemptDetail(Long id, Long userId, String guestToken) {
    Attempt a = owned(id, userId, guestToken, false);
    List<AttemptDetailRes.QuestionDto> items =
        orderedQuestions(a).stream()
            .map(
                q ->
                    new AttemptDetailRes.QuestionDto(
                        q.getId(), q.getText(), q.getType().name(), q.getChoices(), q.getScore()))
            .toList();
    List<AnswerReq> saved =
        answers.findByAttemptId(id).stream()
            .map(
                v ->
                    new AnswerReq(
                        v.getQuestion().getId(), v.getSelectedChoices(), v.getResponseText()))
            .toList();
    return new AttemptDetailRes(
        id,
        a.getExam().getId(),
        a.getExam().getTitle(),
        items,
        duration(a),
        a.getStartedAt(),
        Instant.now(),
        a.getSubmittedAt(),
        saved);
  }

  @Transactional
  public void saveAnswers(Long id, List<AnswerReq> payload, Long userId, String guestToken) {
    Attempt a = owned(id, userId, guestToken, true);
    if (a.getSubmittedAt() != null)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 제출된 시험입니다.");
    if (expired(a))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "시험 시간이 종료되었습니다. 제출해주세요.");
    save(a, payload);
  }

  @Transactional
  public AttemptSubmitRes submitAndGrade(
      Long id, Long userId, String guestToken, List<AnswerReq> payload) {
    Attempt a = owned(id, userId, guestToken, true);
    if (a.getSubmittedAt() == null) {
      // Late submissions grade only the answers persisted before the server deadline.
      if (!expired(a) && payload != null) save(a, payload);
      GradingResult result = grading.gradeAttempt(a);
      a.setTotalScore(result.totalScore());
      a.setSubmittedAt(Instant.now());
      answers.saveAll(result.gradedAnswers());
      attempts.save(a);
    }
    int total = questions.findByExamId(a.getExam().getId()).size();
    int correct =
        (int)
            answers.findByAttemptId(id).stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsCorrect()))
                .count();
    return new AttemptSubmitRes(
        id, a.getExam().getId(), a.getTotalScore(), correct, total - correct, total);
  }

  @Transactional(readOnly = true)
  public Page<AttemptHistoryDto> getAttemptHistory(Long userId, Pageable pageable) {
    return attempts.findByUserId(userId, pageable)
        .map(a -> new AttemptHistoryDto(a, a.getSubmittedAt() == null && expired(a)));
  }

  @Transactional(readOnly = true)
  public List<AttemptReviewRes> getReview(Long id, Long userId, String guestToken) {
    Attempt a = owned(id, userId, guestToken, false);
    if (a.getSubmittedAt() == null)
      throw new ResponseStatusException(HttpStatus.CONFLICT, "제출 후 결과를 확인할 수 있습니다.");
    Map<Long, Answer> saved =
        answers.findByAttemptId(id).stream()
            .collect(Collectors.toMap(v -> v.getQuestion().getId(), v -> v));
    return orderedQuestions(a).stream()
        .map(
            q -> {
              Answer v = saved.get(q.getId());
              return new AttemptReviewRes(
                  q.getId(),
                  q.getText(),
                  q.getType().name(),
                  q.getChoices(),
                  v == null ? null : v.getSelectedChoices(),
                  v == null ? null : v.getResponseText(),
                  q.correctAnswer(),
                  v != null && Boolean.TRUE.equals(v.getIsCorrect()),
                  q.getScore(),
                  q.getExplanation());
            })
        .toList();
  }

  private void save(Attempt a, List<AnswerReq> payload) {
    if (payload == null || payload.size() > 1000)
      throw new IllegalArgumentException("Invalid answers");
    Map<Long, Question> valid =
        questions.findByExamId(a.getExam().getId()).stream()
            .collect(Collectors.toMap(Question::getId, q -> q));
    Map<Long, Answer> saved =
        answers.findByAttemptId(a.getId()).stream()
            .collect(Collectors.toMap(v -> v.getQuestion().getId(), v -> v));
    Set<Long> seen = new HashSet<>();
    for (AnswerReq req : payload) {
      Question q = valid.get(req.questionId());
      if (q == null || !seen.add(req.questionId()))
        throw new IllegalArgumentException("Invalid question");
      Answer v = saved.getOrDefault(q.getId(), Answer.builder().attempt(a).question(q).build());
      v.setSelectedChoices(q.getType() == QuestionType.MCQ ? req.selectedChoices() : null);
      v.setResponseText(q.getType() == QuestionType.SUBJECTIVE ? req.responseText() : null);
      answers.save(v);
    }
  }

  private Attempt owned(Long id, Long userId, String token, boolean lock) {
    Attempt a = (lock ? attempts.findLockedById(id) : attempts.findById(id)).orElseThrow();
    boolean allowed =
        a.getUser() != null
            ? a.getUser().getId().equals(userId)
            : token != null
                && a.getGuestTokenHash() != null
                && MessageDigest.isEqual(
                    a.getGuestTokenHash().getBytes(StandardCharsets.UTF_8),
                    hash(token).getBytes(StandardCharsets.UTF_8));
    if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 응시에 접근할 수 없습니다.");
    return a;
  }

  private int duration(Attempt a) {
    return a.getDurationSec() != null ? a.getDurationSec() : a.getExam().getDurationSec();
  }

  private boolean expired(Attempt a) {
    return !Instant.now().isBefore(a.getStartedAt().plusSeconds(duration(a)));
  }

  private List<Question> orderedQuestions(Attempt a) {
    List<Question> list = new ArrayList<>(questions.findByExamId(a.getExam().getId()));
    list.sort(Comparator.comparing(Question::getId));
    Collections.shuffle(list, new Random(a.getId()));
    return list;
  }

  private String hash(String token) {
    if (token == null || token.length() > 128)
      throw new IllegalArgumentException("Invalid guest token");
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
