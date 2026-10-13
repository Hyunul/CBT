package com.example.cbt.exam.series;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@Table(name = "exam_series")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExamSeries {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String name; // e.g. "정보처리기사", "TOEIC"

  @Column(length = 500)
  private String description;

  @org.hibernate.annotations.CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;

  @org.hibernate.annotations.UpdateTimestamp private Instant updatedAt;

  @com.fasterxml.jackson.annotation.JsonIgnore
  @OneToMany(mappedBy = "series", fetch = FetchType.LAZY)
  private java.util.List<com.example.cbt.exam.Exam> exams;
}
