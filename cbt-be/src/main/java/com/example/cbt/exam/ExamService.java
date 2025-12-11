package com.example.cbt.exam;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.attempt.AttemptStatus;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;

import lombok.RequiredArgsConstructor;

import com.example.cbt.exam.dto.ExamSaveReq;
import com.example.cbt.exam.series.ExamSeries;
import com.example.cbt.exam.series.ExamSeriesRepository;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamSeriesRepository examSeriesRepository;
    private final QuestionRepository questionRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;

    @Transactional
    public Exam create(ExamSaveReq req, Long userId) {
        ExamSeries series = null;
        if (req.getSeriesId() != null) {
            series = examSeriesRepository.findById(req.getSeriesId())
                .orElseThrow(() -> new RuntimeException("Series not found"));
        }

        Exam exam = Exam.builder()
                .title(req.getTitle())
                .durationSec(req.getDurationSec())
                .series(series)
                .round(req.getRound())
                .isPublished(req.isPublished())
                .createdBy(userId)
                .build();
        
        return examRepository.save(exam);
    }

    public Exam get(Long id) {
        return examRepository.findById(id).orElseThrow();
    }

    @Transactional(readOnly = true)
    public Page<Exam> searchPublishedExams(String searchTerm, Pageable pageable) {
        Specification<Exam> spec = (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.isTrue(root.get("isPublished"));

            if (searchTerm != null && !searchTerm.isBlank()) {
                predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), "%" + searchTerm.toLowerCase() + "%")
                );
            }
            return predicate;
        };
        return examRepository.findAll(spec, pageable);
    }

    public List<Exam> listAll() {
        return examRepository.findAllByOrderByIdDesc();
    }

    public List<Exam> getBySeriesId(Long seriesId) {
        return examRepository.findBySeriesIdOrderByRoundAsc(seriesId);
    }

    @Transactional(readOnly = true)
    public List<Exam> getPopularExams() {
        return examRepository.findTop10ByIsPublishedTrueOrderByAttemptCountDesc();
    }

    @Transactional(readOnly = true)
    public List<Exam> getOtherPublishedExams(List<Long> popularExamIds) {
        if (popularExamIds == null || popularExamIds.isEmpty()) {
            return examRepository.findAll(
                (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("isPublished"))
            );
        }
        return examRepository.findAllByIsPublishedTrueAndIdNotIn(popularExamIds);
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
