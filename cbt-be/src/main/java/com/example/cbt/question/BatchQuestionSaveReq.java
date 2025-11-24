package com.example.cbt.question;

import java.util.List;

public record BatchQuestionSaveReq(
        List<QuestionCreateReq> questions
) {}