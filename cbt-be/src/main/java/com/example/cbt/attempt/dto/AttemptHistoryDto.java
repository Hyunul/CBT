package com.example.cbt.attempt.dto;

import java.time.LocalDateTime;
import java.time.ZoneId;

import com.example.cbt.attempt.Attempt;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttemptHistoryDto {
    private Long attemptId;
    private String examTitle;
    private LocalDateTime submissionDate;
    private Integer finalScore;
    private String status; 

    public AttemptHistoryDto(Attempt attempt) {
        this.attemptId = attempt.getId();
        // JPA 매핑된 Exam 객체에서 제목을 가져옴
        this.examTitle = attempt.getExam().getTitle(); 
        
        // Instant를 시스템 기본 ZoneId를 사용하여 LocalDateTime으로 변환
        this.submissionDate = attempt.getSubmittedAt() != null 
                              ? LocalDateTime.ofInstant(attempt.getSubmittedAt(), ZoneId.systemDefault())
                              : LocalDateTime.ofInstant(attempt.getStartedAt(), ZoneId.systemDefault());
        
        // totalScore 필드를 DTO의 finalScore에 매핑
        this.finalScore = attempt.getTotalScore(); 
        this.status = attempt.getStatus().name();
    }
}