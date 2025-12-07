package com.example.cbt.exam;

import java.util.List;

public record ExamListRes(
    List<Exam> popularExams,
    List<Exam> otherExams
) {}
