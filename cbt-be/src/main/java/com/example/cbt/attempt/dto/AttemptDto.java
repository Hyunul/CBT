package com.example.cbt.attempt.dto;

import java.time.Instant;
import java.util.List;

public record AttemptDto(
        Long id,
        Long examId,
        Long userId,
        String status,
        Instant startedAt,
        Instant submittedAt,
        Integer totalScore,
        List<QuestionDto> questions
) {
    public record QuestionDto(
            Long id,
            String type,
            String text,
            String choices,
            Integer score
    ) {}
}
