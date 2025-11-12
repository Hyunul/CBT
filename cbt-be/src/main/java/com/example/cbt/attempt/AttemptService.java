package com.example.cbt.attempt;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptDto;
import com.example.cbt.attempt.dto.SubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamService;
import com.example.cbt.grading.GradingService;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;

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
    public void upsertAnswers(Long attemptId, Long userId, List<AnswerReq> answers) {
        Attempt attempt = attemptRepository.findById(attemptId).orElseThrow();
        if (!attempt.getUserId().equals(userId) || attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new IllegalStateException("수정 불가 상태 혹은 권한 없음");
        }
        for (AnswerReq req : answers) {
            Answer a = answerRepository.findByAttemptIdAndQuestionId(attemptId, req.questionId());
            if (a == null) {
                a = Answer.builder().attemptId(attemptId).questionId(req.questionId()).build();
            }
            a.setSelectedChoices(req.selectedChoices());
            a.setResponseText(req.responseText());
            answerRepository.save(a);
        }
    }

    @Transactional
    public SubmitRes submitAndAutoGrade(Long attemptId, Long userId) {
        Attempt attempt = attemptRepository.findById(attemptId).orElseThrow();
        if (!attempt.getUserId().equals(userId)) {
            throw new IllegalStateException("권한 없음");
        }
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attemptRepository.save(attempt);

        gradingService.autoGradeAttempt(attemptId);

        // 총점 집계
        List<Answer> all = answerRepository.findByAttemptId(attemptId);
        int total = all.stream().mapToInt(a -> a.getScoreAwarded() == null ? 0 : a.getScoreAwarded()).sum();
        attempt.setTotalScore(total);
        attempt.setStatus(AttemptStatus.GRADED);
        attemptRepository.save(attempt);

        return new SubmitRes(attemptId, total);
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
}
