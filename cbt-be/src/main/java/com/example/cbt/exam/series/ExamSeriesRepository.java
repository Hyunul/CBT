package com.example.cbt.exam.series;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamSeriesRepository extends JpaRepository<ExamSeries, Long> {
}
