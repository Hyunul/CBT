package com.example.cbt.ranking;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.cbt.common.ApiResponse;
import com.example.cbt.ranking.dto.SubmissionRankingDto;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rankings/submissions")
@RequiredArgsConstructor
public class SubmissionRankingController {

    private final SubmissionRankingService rankingService;

    /**
     * 상위 N명 랭킹 조회
     * 예: GET /api/rankings/submissions?limit=50
     */
    @GetMapping
    public ApiResponse<List<SubmissionRankingDto>> getTopRankings(
            @RequestParam(defaultValue = "100") int limit
    ) {
        return ApiResponse.ok(rankingService.getTopRankings(limit));
    }

    /**
     * 나의 랭킹 조회
     * 예: GET /api/rankings/submissions/me?userId=123
     *  (실서비스에선 userId는 JWT에서 꺼내는게 좋음)
     */
    @GetMapping("/me")
    public ApiResponse<SubmissionRankingDto> getMyRanking(
            @RequestParam Long userId
    ) {
        return ApiResponse.ok(rankingService.getMyRanking(userId));
    }

    /**
     * (옵션) 주간 랭킹 초기화 – 관리자 전용
     */
    @PostMapping("/reset")
    public ApiResponse<Boolean> resetWeekly() {
        rankingService.resetWeekly();
        return ApiResponse.ok(true);
    }
}
