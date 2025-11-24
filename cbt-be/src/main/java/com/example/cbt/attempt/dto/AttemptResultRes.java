package com.example.cbt.attempt.dto;

import java.util.List;

public record AttemptResultRes(
        int totalScore,
        List<AnswerDetail> answers
) {
    public record AnswerDetail(
            Long questionId,
            String questionText,
            String type,
            String selectedChoices,
            String responseText,
            String correctAnswer,
            boolean isCorrect,
            int score,
            int scoreAwarded
    ) {}
}
