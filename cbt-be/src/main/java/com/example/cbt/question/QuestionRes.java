package com.example.cbt.question;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuestionRes {
    private Long id;
    private QuestionType type;
    private String text;
    private String choices; // JSON string
    private Integer score;
    // 정답(answerKey)과 해설(explanation)은 제외
    
    public static QuestionRes from(Question q) {
        return QuestionRes.builder()
                .id(q.getId())
                .type(q.getType())
                .text(q.getText())
                .choices(q.getChoices())
                .score(q.getScore())
                .build();
    }
}
