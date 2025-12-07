package com.example.cbt.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamGradedEvent {
    private Long userId;
    private Long examId;
    private int score;
}
