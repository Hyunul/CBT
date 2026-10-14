package com.example.cbt.exam;

import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.exam.dto.ExamSaveReq;
import com.example.cbt.exam.dto.StudyQuestionRes;
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
            .type(req.getType() == null ? ExamType.WRITTEN : req.getType())
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
    if (req.getType() != null) exam.setType(req.getType());
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
    return examRepository.findBySeriesIdAndIsPublishedTrueOrderByRoundDesc(seriesId);
  }

  @Transactional(readOnly = true)
  public List<Exam> getPopularExams() {
    List<Long> ids = examRepository.findPopularIds(org.springframework.data.domain.PageRequest.of(0, 10));
    java.util.Map<Long, Exam> byId = new java.util.HashMap<>();
    examRepository.findAllById(ids).forEach(e -> byId.put(e.getId(), e));
    return ids.stream().map(byId::get).toList(); // findAllById 는 순서를 보장하지 않으므로 집계 순서로 되돌린다
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

  /** 실기 시험만 정답·해설을 공개한다. 필기 정답은 응시 제출 후에만 볼 수 있다. */
  @Transactional(readOnly = true)
  public List<StudyQuestionRes> getStudyQuestions(Long examId, boolean admin) {
    if (getVisible(examId, admin).getType() != ExamType.PRACTICAL)
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND, "실기 시험이 아닙니다.");
    return questionRepository.findByExamId(examId).stream()
        .sorted(java.util.Comparator.comparing(Question::getId))
        .map(
            q ->
                new StudyQuestionRes(
                    q.getId(),
                    q.getText(),
                    q.getType().name(),
                    q.getChoices(),
                    q.getScore(),
                    q.correctAnswer(),
                    q.getExplanation()))
        .toList();
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
