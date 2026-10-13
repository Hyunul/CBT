package com.example.cbt.grading;

import com.example.cbt.attempt.Answer;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Attempt;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionType;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GradingService {

  // private final QuestionRepository questionRepository;
  private final AnswerRepository answerRepository;

  public GradingResult gradeAttempt(Attempt attempt) {
    List<Answer> answers = answerRepository.findByAttemptId(attempt.getId());
    // List<Question> questions = questionRepository.findByExamId(attempt.getExam().getId());

    int totalScore = 0;
    int correctCnt = 0;

    for (Answer ans : answers) {
      Question q = ans.getQuestion();
      if (q == null) continue;

      boolean isCorrect = false;
      if (q.getType() == QuestionType.MCQ) {
        isCorrect = q.getAnswerKey() != null && q.getAnswerKey().equals(ans.getSelectedChoices());
      } else {
        isCorrect = matchesKeyword(q.getAnswerKeywords(), ans.getResponseText());
      }

      ans.setIsCorrect(isCorrect);
      ans.setScoreAwarded((isCorrect ? q.getScore() : 0));

      if (isCorrect) correctCnt++;
      totalScore += ans.getScoreAwarded();
    }
    return new GradingResult(totalScore, correctCnt, answers);
  }

  /** 쉼표로 구분된 정답 후보 중 하나와 일치하면 정답. 정답 자체의 쉼표는 "\," 로 적는다(예: ㄱ\,ㄴ). */
  static boolean matchesKeyword(String keywords, String response) {
    if (keywords == null || response == null) return false;
    String res = normalize(response);
    for (String key : keywords.split("(?<!\\\\),")) {
      String k = normalize(key.replace("\\,", ","));
      if (!k.isEmpty() && k.equalsIgnoreCase(res)) return true;
    }
    return false;
  }

  /** "ㄱ, ㄴ" 과 "ㄱ,ㄴ" 을 같게 본다. */
  private static String normalize(String s) {
    return s.strip().replaceAll("\\s*,\\s*", ",");
  }
}
