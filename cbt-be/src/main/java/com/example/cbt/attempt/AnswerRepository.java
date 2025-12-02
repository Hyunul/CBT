package com.example.cbt.attempt;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByAttemptId(Long attemptId);
    void deleteByAttemptId(Long attemptId);
    @Query("SELECT a FROM Answer a WHERE a.attempt.id = :attemptId AND a.questionId = :questionId")
    Optional<Answer> findByAttemptIdAndQuestionId(@Param("attemptId") Long attemptId, @Param("questionId") Long questionId);
}
