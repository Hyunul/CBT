package com.example.cbt.question;

import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionService {

  private final QuestionRepository questionRepository;
  private final ExamRepository examRepository;
  private final AttemptRepository attemptRepository;

  /**
   * 1번 전략: Attempt 존재 시 문제 수정 금지
   *
   * <p>기존 문제 전체 삭제 후 새 문제 전체 삽입
   */
  @Transactional
  public void replaceAllQuestions(Long examId, List<QuestionCreateReq> reqList) {

    Exam exam = examRepository.findLockedById(examId).orElseThrow();
    // Lock the exam before checking attempts, including in-progress attempts.
    boolean hasLockedAttempt = attemptRepository.existsByExamId(examId);

    if (hasLockedAttempt) {
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "응시 기록이 있어 문항을 수정할 수 없습니다. 시험을 복제하거나 새로 만들어주세요.");
    }

    if (reqList == null || reqList.isEmpty() || reqList.size() > 1000)
      throw new IllegalArgumentException("문항 수는 1~1000개여야 합니다.");
    for (QuestionCreateReq req : reqList) validate(req);

    // 3) 기존 문제 전체 삭제
    questionRepository.deleteByExamId(examId);

    questionRepository.flush();

    // 4) 새 문제들 전체 Insert
    for (QuestionCreateReq req : reqList) {

      Question q =
          Question.builder()
              .exam(exam)
              .text(req.text())
              .type(QuestionType.valueOf(req.type()))
              .choices(req.choices())
              .answerKey(req.answerKey())
              .answerKeywords(req.answerKeywords())
              .score(req.score())
              .tags(req.tags())
              .explanation(req.explanation())
              .build();

      questionRepository.save(q);
    }
  }

  private void validate(QuestionCreateReq q) {
    if (q.text() == null
        || q.text().isBlank()
        || q.text().length() > 20000
        || q.score() == null
        || q.score() < 1
        || q.score() > 1000) throw new IllegalArgumentException("문항 내용과 배점을 확인해주세요.");
    QuestionType type = QuestionType.valueOf(q.type());
    if (type == QuestionType.MCQ) {
      try {
        com.fasterxml.jackson.databind.JsonNode choices =
            new com.fasterxml.jackson.databind.ObjectMapper().readTree(q.choices());
        if (!choices.isObject()
            || choices.size() < 2
            || choices.size() > 20
            || q.answerKey() == null
            || !choices.has(q.answerKey())) throw new IllegalArgumentException("보기와 정답을 확인해주세요.");
        for (var choice : choices)
          if (!choice.isTextual() || choice.asText().isBlank())
            throw new IllegalArgumentException("빈 보기입니다.");
      } catch (java.io.IOException e) {
        throw new IllegalArgumentException("보기 형식이 올바르지 않습니다.");
      }
    } else if (q.answerKeywords() == null || q.answerKeywords().isBlank()) {
      throw new IllegalArgumentException("정답을 입력해주세요.");
    }
  }
}
