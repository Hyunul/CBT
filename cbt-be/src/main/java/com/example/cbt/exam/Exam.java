package com.example.cbt.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Formula("(select count(q.id) from questions q where q.exam_id = id)")
    private int questionCount;

    @Formula("(select count(a.id) from attempts a where a.exam_id = id)")
    private int attemptCount;

    private Integer durationSec; // 시험 시간(초)

    private Integer totalScore; // 총점

    private boolean isPublished; // 공개 여부

    @Column(nullable = false)
    private Long createdBy; // 작성자 ID (User 엔티티를 직접 참조하지 않고 ID만 참조)

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    // 단방향 관계: Question 엔티티에 Attempt 객체가 아닌 Exam 객체를 참조한다고 가정
    // Question 클래스가 다른 패키지(com.example.cbt.question)에 있다고 가정
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<com.example.cbt.question.Question> questions;
}