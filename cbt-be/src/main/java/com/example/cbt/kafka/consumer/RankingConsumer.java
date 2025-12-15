package com.example.cbt.kafka.consumer;

import com.example.cbt.attempt.AttemptService;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.ranking.SubmissionRankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingConsumer {

    private final SubmissionRankingService rankingService;

    @KafkaListener(topics = AttemptService.TOPIC_EXAM_GRADED, groupId = "${spring.kafka.consumer.group-id}")
    public void consumeExamGradedEvent(ExamGradedEvent event) {
        log.info("Consumed ExamGradedEvent from Kafka: {}", event);
        try {
            // 1. 응시 횟수 랭킹 증가
            rankingService.increaseSubmission(event.getUserId());

            // 2. 시험 점수 랭킹 업데이트 (시험 ID, 사용자 ID, 최종 점수)
            rankingService.updateExamRanking(
                event.getExamId(),
                event.getUserId(),
                event.getScore()
            );
            log.info("Successfully updated ranking for user: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Error processing ExamGradedEvent for user " + event.getUserId(), e);
            // Optionally, send to a Dead Letter Topic (DLT) here
        }
    }
}
