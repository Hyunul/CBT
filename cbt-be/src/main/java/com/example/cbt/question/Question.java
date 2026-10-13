package com.example.cbt.question;

import com.example.cbt.exam.Exam;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "questions")
public class Question {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Exam과 다대일 관계
  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "exam_id")
  private Exam exam;

  @Enumerated(EnumType.STRING)
  private QuestionType type; // 객관식(MCQ), 주관식(SUBJECTIVE)

  @Column(columnDefinition = "TEXT", nullable = false)
  private String text; // 문제 내용

  @Column(columnDefinition = "JSON")
  private String choices; // 객관식 보기 (JSON 배열)

  private String answerKey; // 객관식 정답

  @Column(columnDefinition = "TEXT")
  private String answerKeywords; // 주관식 정답 키워드(쉼표 구분)

  private Integer score;

  private String tags;

  @Column(columnDefinition = "TEXT")
  private String explanation; // 해설

  /** 객관식은 정답 번호, 주관식은 정답 키워드(정답 속 쉼표 "\," 는 ","로 표시). */
  public String correctAnswer() {
    if (type == QuestionType.MCQ) return answerKey;
    return answerKeywords == null ? null : answerKeywords.replace("\\,", ",");
  }
}
