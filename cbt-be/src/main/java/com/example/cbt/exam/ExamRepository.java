package com.example.cbt.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByCreatedBy(Long userId);
}
