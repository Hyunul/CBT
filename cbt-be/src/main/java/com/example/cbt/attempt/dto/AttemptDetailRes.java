package com.example.cbt.attempt.dto;

import java.util.List;

public record AttemptDetailRes(
    Long attemptId,
    Long examId,
    String examTitle,
    List<QuestionDto> questions,
    Integer durationSec,
    java.time.Instant startedAt
) {
    public record QuestionDto(
        Long id,
        String text,
        String type,
        String choices,
        Integer score
    ) {}
}
