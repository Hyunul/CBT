package com.example.cbt.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;
import java.util.List;

import com.example.cbt.exam.series.ExamSeries;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "exams", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"series_id", "round"})
})
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

    @Formula("(select count(q.id) from questions q where q.exam_id = id)")
    private int questionCount;

    @Formula("(select count(a.id) from attempts a where a.exam_id = id)")
    private int attemptCount;

    private Integer durationSec; // 시험 시간(초)

    private Integer totalScore; // 총점

    @Column(nullable = false)
    private boolean isPublished; // 공개 여부

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private com.example.cbt.user.User author;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<com.example.cbt.question.Question> questions;
}