package com.example.cbt.attempt;

import com.example.cbt.exam.Exam;
import com.example.cbt.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "attempts")
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ManyToOne 관계: Exam 엔티티 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam; // <--- Exam 객체 참조

    // ManyToOne 관계: User 엔티티 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // <--- User 객체 참조

    @Enumerated(EnumType.STRING)
    private AttemptStatus status; // IN_PROGRESS, SUBMITTED, GRADED

    @CreationTimestamp
    private Instant startedAt;

    private Instant submittedAt;

    // DTO에서 finalScore로 사용되던 필드를 totalScore로 확정
    private Integer totalScore; 

    // Answer 엔티티에 Attempt attempt 필드가 있다고 가정
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<com.example.cbt.attempt.Answer> answers;
}