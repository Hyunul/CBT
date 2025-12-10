package com.example.cbt.question;

public record QuestionCreateReq(
        String text,
        String type,
        String choices,
        String answerKey,
        String answerKeywords,
        Integer score,
        String tags,
        String explanation
) {}
