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

  // 응시 수 순 공개 시험 id. Exam 에 @Formula 로 두면 시험을 읽을 때마다(응시 시작의 잠금 조회 포함) 응시 전체를 세므로 목록에서만 집계한다.
  // ponytail: 목록 조회마다 attempts 를 집계함 — 응시가 수십만 건을 넘으면 시험별 카운터 컬럼이나 캐시로 바꿀 것
  @org.springframework.data.jpa.repository.Query(
      "select e.id from Exam e left join com.example.cbt.attempt.Attempt a on a.exam = e"
          + " where e.isPublished = true group by e.id order by count(a.id) desc, e.id asc")
  List<Long> findPopularIds(org.springframework.data.domain.Pageable page);

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
