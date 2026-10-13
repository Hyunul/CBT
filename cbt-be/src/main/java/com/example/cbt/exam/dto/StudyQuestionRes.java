package com.example.cbt.exam.dto;

/** 실기 학습용 문항: 정답·해설 포함. */
public record StudyQuestionRes(
    Long id, String text, String type, String choices, Integer score, String correctAnswer, String explanation) {}
