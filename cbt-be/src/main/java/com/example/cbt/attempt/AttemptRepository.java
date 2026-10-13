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

  List<Attempt> findByExamId(Long examId);

  boolean existsByExamIdAndSubmittedAtIsNotNull(Long examId);

  Optional<Attempt> findById(Long attemptId);

  boolean existsByExamId(Long examId);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Attempt a where a.id = :id")
  Optional<Attempt> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

  @Query(
      value = "SELECT a FROM Attempt a JOIN FETCH a.exam e WHERE a.user.id = :userId"
          + " ORDER BY a.startedAt DESC",
      countQuery = "SELECT COUNT(a) FROM Attempt a WHERE a.user.id = :userId")
  Page<Attempt> findByUserId(Long userId, Pageable pageable);
}
