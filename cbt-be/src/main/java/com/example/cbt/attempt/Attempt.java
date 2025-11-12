package com.example.cbt.attempt;

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

    private Long examId;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private AttemptStatus status; // 진행중, 제출됨, 채점완료

    @CreationTimestamp
    private Instant startedAt;

    private Instant submittedAt;

    private Integer totalScore;

    @OneToMany(mappedBy = "attemptId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers;
}
