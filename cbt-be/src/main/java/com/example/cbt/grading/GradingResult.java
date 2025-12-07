package com.example.cbt.grading;

import java.util.List;
import com.example.cbt.attempt.Answer;

public record GradingResult(
    int totalScore,
    int correctCount,
    List<Answer> gradedAnswers
) {}
