package com.example.cbt.attempt.dto;

public record AttemptSubmitRes(
    Long attemptId,
    Long examId,
    Integer totalScore,
    Integer correctCount,
    Integer wrongCount,
    Integer questionCount
) {}
