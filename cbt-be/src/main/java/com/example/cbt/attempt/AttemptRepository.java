package com.example.cbt.attempt;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByExamIdAndSubmittedAtIsNull(Long examId);
    boolean existsByExamIdAndSubmittedAtIsNotNull(Long examId);
    Optional<Attempt> findById(Long attemptId);
    @Query("SELECT a FROM Attempt a JOIN FETCH a.exam e WHERE a.user.id = :userId AND a.submittedAt IS NOT NULL ORDER BY a.startedAt DESC")
    Page<Attempt> findByUserId(Long userId, Pageable pageable);

}