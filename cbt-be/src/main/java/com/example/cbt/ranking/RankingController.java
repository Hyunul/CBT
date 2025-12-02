package com.example.cbt.ranking;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.ranking.dto.RankDto;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ranking")
public class RankingController {

    private final SubmissionRankingService rankingService;

    /**
     * GET /api/ranking/exam/{examId}
     * 특정 시험의 점수 기반 랭킹을 조회합니다. (상위 50명)
     */
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<RankDto>> getExamRanking(
            @PathVariable Long examId,
            @RequestParam(defaultValue = "50") int limit) {
        
        List<RankDto> ranks = rankingService.getExamRanking(examId, limit);
        return ResponseEntity.ok(ranks);
    }

    /**
     * GET /api/ranking/global/submissions
     * 전체 응시 횟수 기반 랭킹을 조회합니다. (상위 50명)
     */
    @GetMapping("/global/submissions")
    public ResponseEntity<List<RankDto>> getGlobalRanking(
            @RequestParam(defaultValue = "50") int limit) {

        List<RankDto> ranks = rankingService.getGlobalSubmissionRanking(limit);
        return ResponseEntity.ok(ranks);
    }
}