package com.example.cbt.exam.series;

import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamSeriesService {

    private final ExamSeriesRepository examSeriesRepository;
    private final ExamRepository examRepository;
    // We cannot inject ExamService here due to circular dependency (ExamService likely uses ExamSeriesRepository or Service)
    // Wait, ExamService uses ExamSeriesRepository. If ExamSeriesService uses ExamService, it's a cycle.
    // Let's check ExamService again.
    // ExamService injects ExamSeriesRepository.
    // So if I inject ExamService here, I get a cycle.
    
    // Alternative: Move the logic of deleting exams into a helper or reproduce it here?
    // Or just use repositories if the logic is simple enough?
    // ExamService.delete logic:
    // 1. find in-progress attempts -> delete answers, delete attempts
    // 2. delete exam (cascade deletes questions)
    
    // I will replicate the logic here or break the cycle later. For now, replicating is safer for quick fix 
    // BUT ExamService.delete logic is specific about "IN_PROGRESS only".
    // If I delete a series, I probably want to nuke EVERYTHING including completed attempts?
    // Or maybe just unlink them?
    // Usually "Delete Series" implies "Delete this category". 
    // If "force delete", I should probably delete everything related.
    
    // Let's use repositories directly to avoid cycle.
    private final com.example.cbt.attempt.AttemptRepository attemptRepository;
    private final com.example.cbt.attempt.AnswerRepository answerRepository;

    @Transactional
    public void delete(Long seriesId, boolean force) {
        // 1. 해당 시리즈를 참조하는 Exam 목록 조회
        List<Exam> exams = examRepository.findBySeriesIdOrderByRoundAsc(seriesId);
        
        if (!exams.isEmpty()) {
            if (!force) {
                throw new RuntimeException("Cannot delete series because it has associated exams. Use force=true to delete all associated exams.");
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
        ExamSeries series = examSeriesRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Series not found: " + id));
        
        series.setName(name);
        series.setDescription(description);
        
        return examSeriesRepository.save(series);
    }
    
    private void deleteExamData(Exam exam) {
        // Delete all attempts (both completed and in-progress) for this exam
        // Because if the exam is gone, the history is invalid/orphan.
        // Or should we keep history? Typically if you delete the structure, you delete the data.
        
        // Find all attempts
        List<com.example.cbt.attempt.Attempt> attempts = attemptRepository.findByExamId(exam.getId());
        for (com.example.cbt.attempt.Attempt attempt : attempts) {
            answerRepository.deleteByAttemptId(attempt.getId());
        }
        attemptRepository.deleteAll(attempts);
        
        // Delete exam (questions will be deleted via Cascade on Entity if configured, let's check Exam entity)
        // Exam.java: @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true) private List<Question> questions;
        // So questions are auto-deleted.
        
        examRepository.delete(exam);
    }
}
