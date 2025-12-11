package com.example.cbt.attempt;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType; // ⭐ 추가
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn; // ⭐ 추가
import jakarta.persistence.ManyToOne; // ⭐ 추가
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private com.example.cbt.question.Question question;

    // private Long attemptId; // ❌ 제거: ManyToOne 관계로 대체

    // ⭐ [추가됨]: Attempt 엔티티의 mappedBy 대상 필드입니다. 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt; // 필드 이름이 "attempt"여야 함

    @Column(columnDefinition = "TEXT")
    private String selectedChoices; // 객관식 답변 (JSON 문자열)

    @Column(columnDefinition = "TEXT")
    private String responseText; // 주관식 답변

    private Boolean isCorrect;

    private Integer scoreAwarded;
}