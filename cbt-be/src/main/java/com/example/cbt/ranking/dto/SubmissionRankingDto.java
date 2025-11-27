package com.example.cbt.ranking.dto;

public record SubmissionRankingDto(
        Long userId,
        Long rank,          // 1위부터 시작
        Long submissionCount
) {}
