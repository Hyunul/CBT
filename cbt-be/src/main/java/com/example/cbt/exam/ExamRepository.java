package com.example.cbt.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long>, JpaSpecificationExecutor<Exam> {
    List<Exam> findByAuthorId(Long userId);
    List<Exam> findTop10ByIsPublishedTrueOrderByAttemptCountDesc();
    List<Exam> findAllByIsPublishedTrueAndIdNotIn(List<Long> ids);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"series"})
    List<Exam> findBySeriesIdOrderByRoundAsc(Long seriesId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"series"})
    List<Exam> findAllByOrderByIdDesc();

    boolean existsBySeriesId(Long seriesId);

    boolean existsBySeriesIdAndRound(Long seriesId, Integer round);
}
