package com.example.cbt.ranking;

import com.example.cbt.event.ExamSubmittedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RankingEventListener {

    private final SubmissionRankingService submissionRankingService;

    @KafkaListener(topics = "exam-submitted", groupId = "cbt-ranking-group")
    public void handleExamSubmitted(ExamSubmittedEvent event) {
        log.info("Kafka: Received exam submitted event for attemptId={}", event.getAttemptId());

        if (event.getUserId() != null) {
            try {
                // Update Exam Ranking
                submissionRankingService.updateExamRanking(event.getExamId(), event.getUserId(), event.getTotalScore());
                
                // Update Global Submission Count
                submissionRankingService.increaseSubmission(event.getUserId());
                
                log.info("Kafka: Successfully updated ranking for userId={}", event.getUserId());
            } catch (Exception e) {
                log.error("Kafka: Failed to update ranking for attemptId={}", event.getAttemptId(), e);
            }
        } else {
            log.info("Kafka: Skipped ranking update for guest attemptId={}", event.getAttemptId());
        }
    }
}
