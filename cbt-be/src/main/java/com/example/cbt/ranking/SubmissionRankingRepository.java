package com.example.cbt.ranking;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class SubmissionRankingRepository {

    private static final String KEY_WEEKLY_SUBMISSION = "ranking:submissions:weekly";

    private final StringRedisTemplate redisTemplate;

    /**
     * 특정 유저의 제출 횟수를 1 증가
     */
    public void incrementSubmissionCount(Long userId) {
        ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
        zset.incrementScore(KEY_WEEKLY_SUBMISSION, String.valueOf(userId), 1.0);
    }

    /**
     * 상위 N명 랭킹 조회 (점수 포함)
     */
    public List<ZSetOperations.TypedTuple<String>> getTopN(int limit) {
        ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
        Set<ZSetOperations.TypedTuple<String>> result =
                zset.reverseRangeWithScores(KEY_WEEKLY_SUBMISSION, 0, limit - 1);

        return result != null ? new ArrayList<>(result) : List.of();
    }

    /**
     * 특정 유저의 현재 랭킹(0부터 시작) 조회
     */
    public Long getUserRank(Long userId) {
        ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
        return zset.reverseRank(KEY_WEEKLY_SUBMISSION, String.valueOf(userId));
    }

    /**
     * 특정 유저의 현재 제출 횟수(점수) 조회
     */
    public Double getUserScore(Long userId) {
        ZSetOperations<String, String> zset = redisTemplate.opsForZSet();
        return zset.score(KEY_WEEKLY_SUBMISSION, String.valueOf(userId));
    }

    /**
     * 주간 랭킹 초기화 (월요일 0시에 배치로 호출하는 식으로)
     */
    public void resetWeeklyRanking() {
        redisTemplate.delete(KEY_WEEKLY_SUBMISSION);
    }
}
