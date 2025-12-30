package com.example.cbt.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamSubmittedEvent {
    private Long attemptId;
    private Long examId;
    private Long userId;
    private double totalScore;
}
