package com.example.cbt.attempt;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "answers")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;

    private Long attemptId;

    @Column(columnDefinition = "TEXT")
    private String selectedChoices; // 객관식 답변 (JSON 문자열)

    @Column(columnDefinition = "TEXT")
    private String responseText; // 주관식 답변

    private Boolean isCorrect;

    private Integer scoreAwarded;
}
