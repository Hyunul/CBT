package com.example.cbt.exam;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.attempt.AttemptStatus;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;

    @Transactional
    public Exam create(Exam exam) {
        return examRepository.save(exam);
    }

    public Exam get(Long id) {
        return examRepository.findById(id).orElseThrow();
    }

    public List<Exam> listPublished() {
        return examRepository.findByIsPublishedTrue();
    }

    @Transactional
    public Exam publish(Long id, boolean published) {
        Exam e = get(id);
        e.setPublished(published);
        return examRepository.save(e);
    }

    public List<Question> getQuestions(Long examId) {
        return questionRepository.findByExamId(examId);
    }

    @Transactional
    public void delete(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exam not found: " + id));

        // IN_PROGRESS 상태의 Attempt만 삭제
        List<Attempt> inProgressAttempts = attemptRepository.findByExamIdAndStatus(id, AttemptStatus.IN_PROGRESS);

        // 관련 Answer 삭제
        for (Attempt attempt : inProgressAttempts) {
            answerRepository.deleteByAttemptId(attempt.getId());
        }

        // Attempt 삭제
        attemptRepository.deleteAll(inProgressAttempts);

        // 시험 삭제 (문제도 함께 cascade로 삭제됨)
        examRepository.delete(exam);
    }
}
