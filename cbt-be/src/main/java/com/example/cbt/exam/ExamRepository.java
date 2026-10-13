package com.example.cbt.exam;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long>, JpaSpecificationExecutor<Exam> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select e from Exam e where e.id = :id")
  java.util.Optional<Exam> findLockedById(
      @org.springframework.data.repository.query.Param("id") Long id);

  List<Exam> findByAuthorId(Long userId);

  List<Exam> findTop10ByIsPublishedTrueOrderByAttemptCountDesc();

  List<Exam> findAllByIsPublishedTrueAndIdNotIn(List<Long> ids);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"series"})
  List<Exam> findBySeriesIdOrderByRoundAsc(Long seriesId);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"series"})
  List<Exam> findBySeriesIdAndIsPublishedTrueOrderByRoundDesc(Long seriesId);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"series"})
  List<Exam> findAllByOrderByIdDesc();

  boolean existsBySeriesId(Long seriesId);

  boolean existsBySeriesIdAndRound(Long seriesId, Integer round);
}
