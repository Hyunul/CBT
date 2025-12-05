package com.example.cbt.attempt.dto;

public record AttemptReviewRes(
        Long questionId,
        String questionText,
        String type,              // MCQ or SUBJECTIVE
        String selectedChoices,   // 사용자가 선택한 객관식 답
        String responseText,      // 사용자가 입력한 주관식 답
        String correctAnswer,     // 객관식 정답 or 주관식 키워드
        Boolean isCorrect,
        Integer score,
        String explanation
) {}
