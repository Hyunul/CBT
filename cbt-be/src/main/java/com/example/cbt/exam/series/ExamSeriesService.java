package com.example.cbt.exam.series;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExamSeriesService {

  private final ExamSeriesRepository examSeriesRepository;
  private final ExamRepository examRepository;
  private final com.example.cbt.attempt.AttemptRepository attemptRepository;
  private final com.example.cbt.attempt.AnswerRepository answerRepository;

  @Transactional
  public void delete(Long seriesId, boolean force) {
    // 1. 해당 시리즈를 참조하는 Exam 목록 조회
    List<Exam> exams = examRepository.findBySeriesIdOrderByRoundAsc(seriesId);

    if (!exams.isEmpty()) {
      if (!force) {
        throw new IllegalStateException(
            "Cannot delete series because it has associated exams. Use force=true to delete all"
                + " associated exams.");
      }

      // Force delete: Delete all exams in this series
      for (Exam exam : exams) {
        deleteExamData(exam);
      }
    }

    // 2. 시리즈 삭제
    examSeriesRepository.deleteById(seriesId);
  }

  @Transactional
  public ExamSeries update(Long id, String name, String description) {
    ExamSeries series =
        examSeriesRepository
            .findById(id)
            .orElseThrow(() -> new IllegalStateException("Series not found: " + id));

    series.setName(name);
    series.setDescription(description);

    return examSeriesRepository.save(series);
  }

  private void deleteExamData(Exam exam) {
    examRepository.findLockedById(exam.getId()).orElseThrow();
    List<com.example.cbt.attempt.Attempt> attempts = attemptRepository.findByExamId(exam.getId());
    for (com.example.cbt.attempt.Attempt attempt : attempts) {
      answerRepository.deleteByAttemptId(attempt.getId());
    }
    attemptRepository.deleteAll(attempts);
    examRepository.delete(exam);
  }
}
