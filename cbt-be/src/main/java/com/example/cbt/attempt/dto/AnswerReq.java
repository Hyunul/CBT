package com.example.cbt.attempt.dto;

import jakarta.validation.constraints.*;

public record AnswerReq(
    @NotNull Long questionId,
    @Size(max = 100) String selectedChoices,
    @Size(max = 10000) String responseText) {}
