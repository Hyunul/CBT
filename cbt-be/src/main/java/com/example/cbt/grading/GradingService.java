package com.example.cbt.grading;

import com.example.cbt.attempt.Answer;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Attempt;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GradingService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    public GradingResult gradeAttempt(Attempt attempt) {
        List<Answer> answers = answerRepository.findByAttemptId(attempt.getId());
        List<Question> questions = questionRepository.findByExamId(attempt.getExam().getId());

        int totalScore = 0;
        int correctCnt = 0;

        for (Answer ans : answers) {
            Question q = questions.stream()
                .filter(qq -> qq.getId().equals(ans.getQuestionId()))
                .findFirst().orElseThrow(() -> new RuntimeException("Question not found"));

            boolean isCorrect = false;
            if (q.getType() == QuestionType.MCQ) {
                isCorrect = q.getAnswerKey().equals(ans.getSelectedChoices());
            } else {
                String[] keys = q.getAnswerKeywords().split(",");
                for (String key : keys) {
                    if (ans.getResponseText() != null &&
                        ans.getResponseText().contains(key.trim())) {
                        isCorrect = true;
                        break;
                    }
                }
            }

            ans.setIsCorrect(isCorrect);
            ans.setScoreAwarded((isCorrect ? q.getScore() : 0));

            if (isCorrect) correctCnt++;
            totalScore += ans.getScoreAwarded();
        }
        return new GradingResult(totalScore, correctCnt, answers);
    }
}
