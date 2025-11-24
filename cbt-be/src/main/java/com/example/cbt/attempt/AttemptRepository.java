package com.example.cbt.attempt;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByExamIdAndStatus(Long examId, AttemptStatus status);
    boolean existsByExamIdAndStatusNot(Long examId, AttemptStatus status);
    Optional<Attempt> findById(Long attemptId);
}
