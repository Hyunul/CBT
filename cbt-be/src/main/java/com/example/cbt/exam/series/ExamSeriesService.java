package com.example.cbt.exam.series;

import com.example.cbt.exam.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExamSeriesService {

    private final ExamSeriesRepository examSeriesRepository;
    private final ExamRepository examRepository;

    @Transactional
    public void delete(Long seriesId) {
        // 1. 해당 시리즈를 참조하는 Exam이 있는지 확인
        boolean hasExams = examRepository.existsBySeriesId(seriesId);
        
        if (hasExams) {
            throw new RuntimeException("Cannot delete series because it has associated exams. Please delete the exams first.");
        }

        // 2. 참조하는 Exam이 없으면 안전하게 삭제
        examSeriesRepository.deleteById(seriesId);
    }
}
