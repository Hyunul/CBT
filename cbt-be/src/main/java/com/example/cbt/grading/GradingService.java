package com.example.cbt.grading;

import com.example.cbt.attempt.Answer;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GradingService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    /**
     * 객관식 자동채점 + 주관식 채점 대기 상태 처리
     */
    @Transactional
    public void autoGradeAttempt(Long attemptId) {
        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        for (Answer a : answers) {
            Question q = questionRepository.findById(a.getQuestionId()).orElseThrow();

            if (q.getType() == QuestionType.MCQ) {
                // 객관식 자동채점
                boolean correct = q.getAnswerKey() != null && q.getAnswerKey().equals(a.getSelectedChoices());
                a.setIsCorrect(correct);
                a.setScoreAwarded(correct ? q.getScore() : 0);
            } else if (q.getType() == QuestionType.SUBJECTIVE) {
                // 주관식은 키워드 일치 시 자동 1차 채점
                if (q.getAnswerKeywords() != null && a.getResponseText() != null) {
                    boolean match = Arrays.stream(q.getAnswerKeywords().split(","))
                            .anyMatch(k -> a.getResponseText().toLowerCase().contains(k.trim().toLowerCase()));
                    if (match) {
                        a.setIsCorrect(true);
                        a.setScoreAwarded(q.getScore()); // 완전 일치
                    } else {
                        a.setIsCorrect(null); // 수동 검수 필요
                        a.setScoreAwarded(0);
                    }
                } else {
                    a.setIsCorrect(null);
                    a.setScoreAwarded(0);
                }
            }
        }
        answerRepository.saveAll(answers);
    }

    /**
     * 관리자가 수동 채점 (주관식)
     */
    @Transactional
    public void manualGrade(Long answerId, boolean isCorrect, int score) {
        Answer a = answerRepository.findById(answerId).orElseThrow();
        a.setIsCorrect(isCorrect);
        a.setScoreAwarded(score);
        answerRepository.save(a);
    }
}
