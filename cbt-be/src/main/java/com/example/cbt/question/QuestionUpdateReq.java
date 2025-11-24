package com.example.cbt.question;

public record QuestionUpdateReq(
        String text,
        String choices,
        String answerKey,
        String answerKeywords,
        Integer score,
        String tags
) {}
