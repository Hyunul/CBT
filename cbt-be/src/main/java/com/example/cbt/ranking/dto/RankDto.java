package com.example.cbt.ranking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RankDto {
    private int rank;           // 순위 (1부터 시작)
    private Long userId;        // 사용자 ID
    private String username;    // 사용자 이름
    private Double score;       // 점수 또는 응시 횟수
}