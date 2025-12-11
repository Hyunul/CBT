package com.example.cbt.exam.dto;

import lombok.Data;

@Data
public class ExamSaveReq {
    private String title;
    private String description; // 만약 Exam 엔티티에 description이 있다면
    private Integer durationSec;
    private Long seriesId; // 과목(시리즈) ID
    private Integer round; // 회차
    private boolean isPublished;
}
