package com.example.cbt.attempt;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptDto;
import com.example.cbt.attempt.dto.AttemptResultRes;
import com.example.cbt.attempt.dto.SubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamService;
import com.example.cbt.grading.GradingService;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final ExamService examService;
    private final GradingService gradingService;

    @Transactional
    public AttemptDto startAttempt(Long examId, Long userId) {
        Exam exam = examService.get(examId);

        Attempt attempt = Attempt.builder()
                .examId(exam.getId())
                .userId(userId)
                .status(AttemptStatus.IN_PROGRESS)
                .totalScore(0)
                .build();
        attempt = attemptRepository.save(attempt);

        // 최초 Answer row 프리-생성(선택)
        List<Question> questions = questionRepository.findByExam(exam);
        for (Question q : questions) {
            Answer a = Answer.builder()
                    .attemptId(attempt.getId())
                    .questionId(q.getId())
                    .selectedChoices(null)
                    .responseText(null)
                    .isCorrect(null)
                    .scoreAwarded(0)
                    .build();
            answerRepository.save(a);
        }
        return mapToDto(attempt, questions);
    }

    public AttemptDto getAttempt(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId).orElseThrow();
        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());
        return mapToDto(attempt, questions);
    }

    @Transactional
    public void submitAndGrade(Long attemptId) {

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new IllegalStateException("이미 제출된 시험입니다.");
        }

        // 제출 처리
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());

        // 자동 채점 수행
        int totalScore = autoScore(attemptId);
        attempt.setTotalScore(totalScore);

        // 상태 변경
        attempt.setStatus(AttemptStatus.GRADED);

        attemptRepository.save(attempt);
    }

    private AttemptDto mapToDto(Attempt attempt, List<Question> questions) {
        List<AttemptDto.QuestionDto> qDtos = new ArrayList<>();
        for (Question q : questions) {
            qDtos.add(new AttemptDto.QuestionDto(
                    q.getId(),
                    q.getType().name(),
                    q.getText(),
                    q.getChoices(),
                    q.getScore()
            ));
        }
        return new AttemptDto(
                attempt.getId(),
                attempt.getExamId(),
                attempt.getUserId(),
                attempt.getStatus().name(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getTotalScore(),
                qDtos
        );
    }

    @Transactional
    public int autoScore(Long attemptId) {

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());

        int totalScore = 0;

        for (Answer answer : answers) {

            Question q = questions.stream()
                    .filter(x -> x.getId().equals(answer.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            if (q == null) continue;

            boolean correct = false;

            if (q.getType() == QuestionType.MCQ) {

                // 객관식 비교
                if (answer.getSelectedChoices() != null &&
                    answer.getSelectedChoices().equals(q.getAnswerKey())) {
                    correct = true;
                }

            } else {

                // 주관식 (키워드 일부 포함하면 정답 처리)
                if (answer.getResponseText() != null && q.getAnswerKeywords() != null) {
                    String[] keywords = q.getAnswerKeywords().split(",");
                    for (String kw : keywords) {
                        if (answer.getResponseText().contains(kw.trim())) {
                            correct = true;
                            break;
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

    @Transactional(readOnly = true)
    public AttemptResultRes getResult(Long attemptId) {

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> questions = questionRepository.findByExamId(attempt.getExamId());

        List<AttemptResultRes.AnswerDetail> details = answers.stream().map(a -> {

            Question q = questions.stream()
                    .filter(x -> x.getId().equals(a.getQuestionId()))
                    .findFirst()
                    .orElseThrow();

            return new AttemptResultRes.AnswerDetail(
                    q.getId(),
                    q.getText(),
                    q.getType().name(),
                    a.getSelectedChoices(),
                    a.getResponseText(),
                    q.getAnswerKey() != null ? q.getAnswerKey() : q.getAnswerKeywords(),
                    Boolean.TRUE.equals(a.getIsCorrect()),
                    q.getScore(),
                    a.getScoreAwarded()
            );
        }).toList();

        return new AttemptResultRes(attempt.getTotalScore(), details);
    }
}
