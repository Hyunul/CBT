package com.example.cbt.exam;

import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.exam.dto.ExamSaveReq;
import com.example.cbt.exam.series.ExamSeries;
import com.example.cbt.exam.series.ExamSeriesRepository;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionRes;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExamService {

  private final UserRepository userRepository;
  private final ExamRepository examRepository;
  private final ExamSeriesRepository examSeriesRepository;
  private final QuestionRepository questionRepository;
  private final AttemptRepository attemptRepository;
  private final AnswerRepository answerRepository;

  @Transactional
  public Exam create(ExamSaveReq req, Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    ExamSeries series = null;
    if (req.getSeriesId() != null) {
      series =
          examSeriesRepository
              .findById(req.getSeriesId())
              .orElseThrow(() -> new IllegalArgumentException("Series not found"));

      // Validate unique constraint
      if (req.getRound() != null
          && examRepository.existsBySeriesIdAndRound(req.getSeriesId(), req.getRound())) {
        throw new IllegalArgumentException("이미 해당 시리즈에 존재하는 회차입니다: " + req.getRound() + "회차");
      }
    }

    Exam exam =
        Exam.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .durationSec(req.getDurationSec())
            .series(series)
            .round(req.getRound())
            .isPublished(false)
            .author(user)
            .build();

    return examRepository.save(exam);
  }

  @Transactional
  public Exam update(Long id, ExamSaveReq req) {
    Exam exam = examRepository.findLockedById(id).orElseThrow();

    // Update basic fields
    if (req.getTitle() != null) exam.setTitle(req.getTitle());
    if (req.getDescription() != null) exam.setDescription(req.getDescription());
    if (req.getDurationSec() != null) exam.setDurationSec(req.getDurationSec());
    exam.setPublished(req.isPublished());

    Long seriesId = req.getSeriesId();
    if (seriesId != null) {
      exam.setSeries(examSeriesRepository.findById(seriesId).orElseThrow());
    } else {
      exam.setSeries(null);
    }
    exam.setRound(req.getRound());
    if (req.isPublished() && questionRepository.findByExamId(id).isEmpty()) {
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "문항을 등록한 후 공개해주세요.");
    }
    return examRepository.save(exam);
  }

  public Exam get(Long id) {
    return examRepository.findById(id).orElseThrow();
  }

  @Transactional(readOnly = true)
  public Page<Exam> searchPublishedExams(String searchTerm, Pageable pageable) {
    Specification<Exam> spec =
        (root, query, criteriaBuilder) -> {
          Predicate predicate = criteriaBuilder.isTrue(root.get("isPublished"));

          if (searchTerm != null && !searchTerm.isBlank()) {
            predicate =
                criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + searchTerm.toLowerCase() + "%"));
          }
          return predicate;
        };
    return examRepository.findAll(spec, pageable);
  }

  public List<Exam> listAll() {
    return examRepository.findAllByOrderByIdDesc();
  }

  public List<Exam> getBySeriesId(Long seriesId) {
    return examRepository.findBySeriesIdAndIsPublishedTrueOrderByRoundAsc(seriesId);
  }

  @Transactional(readOnly = true)
  public List<Exam> getPopularExams() {
    return examRepository.findTop10ByIsPublishedTrueOrderByAttemptCountDesc();
  }

  @Transactional(readOnly = true)
  public List<Exam> getOtherPublishedExams(List<Long> popularExamIds) {
    if (popularExamIds == null || popularExamIds.isEmpty()) {
      return examRepository.findAll(
          (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("isPublished")));
    }
    return examRepository.findAllByIsPublishedTrueAndIdNotIn(popularExamIds);
  }

  @Transactional
  public Exam publish(Long id, boolean published) {
    Exam e = examRepository.findLockedById(id).orElseThrow();
    if (published && questionRepository.findByExamId(id).isEmpty())
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "문항을 등록해주세요.");
    e.setPublished(published);
    return examRepository.save(e);
  }

  public List<QuestionRes> getQuestions(Long examId) {
    return questionRepository.findByExamId(examId).stream().map(QuestionRes::from).toList();
  }

  public List<Question> getQuestionsWithAnswers(Long examId) {
    return questionRepository.findByExamId(examId);
  }

  @Transactional
  public void delete(Long id) {
    Exam exam = examRepository.findLockedById(id).orElseThrow();
    if (attemptRepository.existsByExamId(id)) {
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "응시 기록이 있는 시험은 삭제할 수 없습니다. 비공개로 전환해주세요.");
    }
    examRepository.delete(exam);
  }

  public Exam getVisible(Long id, boolean admin) {
    Exam exam = get(id);
    if (!admin && !exam.isPublished())
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND, "시험을 찾을 수 없습니다.");
    return exam;
  }
}
