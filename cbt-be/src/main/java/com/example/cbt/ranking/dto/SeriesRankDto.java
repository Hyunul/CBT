package com.example.cbt.ranking.dto;

/** 자격증 종목 랭킹 한 줄: 순위(1부터), 시리즈, 풀이 횟수. */
public record SeriesRankDto(int rank, Long seriesId, String seriesName, long solvedCount) {}
