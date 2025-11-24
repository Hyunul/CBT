package com.example.cbt.question;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.exam.Exam;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByExam(Exam exam);
    List<Question> findByExamId(Long examId);
    @Transactional
    void deleteByExamId(Long examId);
}
