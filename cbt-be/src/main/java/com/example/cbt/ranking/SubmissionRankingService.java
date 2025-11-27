package com.example.cbt.ranking;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.ranking.dto.SubmissionRankingDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubmissionRankingService {

    private final SubmissionRankingRepository rankingRepository;

    /**
     * 시험 제출 시 호출: 유저의 주간 제출 횟수를 1 증가
     */
    @Transactional
    public void increaseSubmission(Long userId) {
        rankingRepository.incrementSubmissionCount(userId);
    }

    /**
     * 상위 N명 랭킹 조회
     */
    @Transactional(readOnly = true)
    public List<SubmissionRankingDto> getTopRankings(int limit) {
        List<ZSetOperations.TypedTuple<String>> redisResult =
                rankingRepository.getTopN(limit);

        List<SubmissionRankingDto> rankings = new ArrayList<>();

        long rank = 1;
        for (ZSetOperations.TypedTuple<String> tuple : redisResult) {
            Long userId = Long.valueOf(tuple.getValue());
            Long count = tuple.getScore() != null ? tuple.getScore().longValue() : 0L;

            rankings.add(new SubmissionRankingDto(userId, rank, count));
            rank++;
        }
        return rankings;
    }

    /**
     * 특정 유저의 나의 랭킹 + 제출횟수 조회
     */
    @Transactional(readOnly = true)
    public SubmissionRankingDto getMyRanking(Long userId) {
        Long rank0 = rankingRepository.getUserRank(userId); // 0-based
        Double score = rankingRepository.getUserScore(userId);

        if (rank0 == null || score == null) {
            return new SubmissionRankingDto(userId, null, 0L);
        }

        return new SubmissionRankingDto(
                userId,
                rank0 + 1,                // 1등부터 시작
                score.longValue()
        );
    }

    /**
     * 주간 랭킹 초기화
     */
    @Transactional
    public void resetWeekly() {
        rankingRepository.resetWeeklyRanking();
    }
}
