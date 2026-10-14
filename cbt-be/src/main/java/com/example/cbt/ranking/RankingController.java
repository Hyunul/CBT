package com.example.cbt.ranking;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.ranking.dto.SeriesRankDto;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ranking")
public class RankingController {

    private final SubmissionRankingService rankingService;

    /**
     * GET /api/ranking/series
     * 자격증 종목(시리즈)별 풀이 횟수 랭킹을 조회합니다. (상위 50개)
     */
    @GetMapping("/series")
    public ResponseEntity<List<SeriesRankDto>> getSeriesRanking(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(rankingService.getSeriesRanking(limit));
    }
}
