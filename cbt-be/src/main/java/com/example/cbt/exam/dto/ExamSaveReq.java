package com.example.cbt.exam.dto;

import lombok.Data;

@Data
public class ExamSaveReq {
  @jakarta.validation.constraints.NotBlank
  @jakarta.validation.constraints.Size(max = 255)
  private String title;

  private String description; // 만약 Exam 엔티티에 description이 있다면

  @jakarta.validation.constraints.NotNull
  @jakarta.validation.constraints.Min(1)
  @jakarta.validation.constraints.Max(86400)
  private Integer durationSec;

  private Long seriesId; // 과목(시리즈) ID

  @jakarta.validation.constraints.Min(1)
  private Integer round; // 회차

  @com.fasterxml.jackson.annotation.JsonProperty("isPublished")
  private boolean isPublished;
}
