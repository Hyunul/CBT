package com.example.cbt.attempt;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AttemptDetailRes;
import com.example.cbt.attempt.dto.AttemptReviewRes;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    /**
     * 1) Attempt 생성 (시험 시작)
     */
    @Transactional
    public Attempt startAttempt(Long examId, Long userId) {

        Attempt attempt = Attempt.builder()
                .examId(examId)
                .userId(userId)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        return attemptRepository.save(attempt);
    }

    /**
     * 2) Attempt 상세 조회 (Question 포함)
     */
    @Transactional(readOnly = true)
    public AttemptDetailRes getAttemptDetail(Long attemptId) {

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        Exam exam = examRepository.findById(attempt.getExamId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        List<Question> questions =
                questionRepository.findByExamId(exam.getId());

        List<AttemptDetailRes.QuestionDto> questionDtos = questions.stream()
                .map(q -> new AttemptDetailRes.QuestionDto(
                        q.getId(),
                        q.getText(),
                        q.getType().name(),
                        q.getChoices(),
                        q.getScore()
                ))
                .toList();

        return new AttemptDetailRes(
                attempt.getId(),
                attempt.getExamId(),
                exam.getTitle(),
                questionDtos
        );
    }

    /**
     * 3) Attempt 제출 + 자동 채점
     */
    @Transactional
    public AttemptSubmitRes submitAndGrade(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("응시 기록이 없습니다."));

        if (attempt.getStatus() == AttemptStatus.GRADED)
            throw new RuntimeException("이미 채점 완료된 응시입니다.");

        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());

        int totalScore = 0;
        int correctCnt = 0;

        for (Answer ans : answers) {
            Question q = questions.stream()
                    .filter(qq -> qq.getId().equals(ans.getQuestionId()))
                    .findFirst().orElseThrow();

            boolean isCorrect = false;

            // 객관식 체크
            if (q.getType() == QuestionType.MCQ) {
                isCorrect = q.getAnswerKey().equals(ans.getSelectedChoices());
            }
            // 주관식 체크 (키워드 포함 여부)
            else {
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
            ans.setScoreAwarded(isCorrect ? q.getScore() : 0);

            if (isCorrect) correctCnt++;
            totalScore += ans.getScoreAwarded();
        }

        attempt.setTotalScore(totalScore);
        attempt.setStatus(AttemptStatus.GRADED);
        attempt.setSubmittedAt(Instant.now());

        answerRepository.saveAll(answers);
        attemptRepository.save(attempt);

        return new AttemptSubmitRes(
                attempt.getId(),
                attempt.getExamId(),
                totalScore,
                correctCnt,
                answers.size() - correctCnt,
                answers.size()
        );
    }

    public List<AttemptReviewRes> getReview(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("응시 내역 없음"));

        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());
        List<Answer> answers = answerRepository.findByAttemptId(attemptId);

        List<AttemptReviewRes> list = new ArrayList<>();

        for (Question q : questions) {
            Answer ans = answers.stream()
                    .filter(a -> a.getQuestionId().equals(q.getId()))
                    .findFirst().orElse(null);

            String correctAnswer = "";
            if (q.getType() == QuestionType.MCQ) {
                correctAnswer = q.getAnswerKey();
            } else {
                correctAnswer = q.getAnswerKeywords();
            }

            list.add(new AttemptReviewRes(
                    q.getId(),
                    q.getText(),
                    q.getType().name(),
                    ans != null ? ans.getSelectedChoices() : null,
                    ans != null ? ans.getResponseText() : null,
                    correctAnswer,
                    ans != null ? ans.getIsCorrect() : false,
                    q.getScore()
            ));
        }

        return list;
    }

    /**
     * 4) 자동 채점 (객관식/주관식)
     */
    @Transactional
    public int autoScore(Long attemptId) {

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());

        int totalScore = 0;

        for (Answer answer : answers) {

            Question q = questions.stream()
                    .filter(qq -> qq.getId().equals(answer.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            if (q == null) continue;

            boolean correct = false;

            switch (q.getType()) {
                case MCQ -> {
                    if (answer.getSelectedChoices() != null &&
                            answer.getSelectedChoices().equals(q.getAnswerKey())) {
                        correct = true;
                    }
                }
                case SUBJECTIVE -> {
                    if (answer.getResponseText() != null &&
                            q.getAnswerKeywords() != null) {

                        String[] keywords = q.getAnswerKeywords().split(",");

                        for (String kw : keywords) {
                            if (answer.getResponseText().contains(kw.trim())) {
                                correct = true;
                                break;
                            }
                        }
                    }
                }
            }

            answer.setIsCorrect(correct);
            answer.setScoreAwarded(correct ? q.getScore() : 0);
            answerRepository.save(answer);

            if (correct) totalScore += q.getScore();
        }

        return totalScore;
    }
}
