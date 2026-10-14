package com.example.cbt.exam;

import com.example.cbt.exam.series.ExamSeries;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "exams",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"series_id", "round"})})
public class Exam {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "series_id")
  private ExamSeries series;

  private Integer round; // 회차 (예: 1회차, 2회차)

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  @Builder.Default
  private ExamType type = ExamType.WRITTEN;

  @Formula("(select count(q.id) from questions q where q.exam_id = id)")
  private int questionCount;

  private Integer durationSec; // 시험 시간(초)

  @Formula("(select coalesce(sum(q.score), 0) from questions q where q.exam_id = id)")
  private Integer totalScore; // 총점

  @Column(nullable = false)
  @com.fasterxml.jackson.annotation.JsonProperty("isPublished")
  private boolean isPublished; // 공개 여부

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  @com.fasterxml.jackson.annotation.JsonIgnoreProperties({
    "email",
    "provider",
    "providerId",
    "createdAt",
    "role"
  })
  private com.example.cbt.user.User author;

  @CreationTimestamp private Instant createdAt;

  @UpdateTimestamp private Instant updatedAt;

  @com.fasterxml.jackson.annotation.JsonIgnore
  @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<com.example.cbt.question.Question> questions;
}
