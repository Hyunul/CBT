package com.example.cbt.ranking;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

import java.util.Set;

@Repository
@RequiredArgsConstructor
public class RankingRepository {

    private final RedisTemplate<String, String> redisTemplate;

    /**
     * ZSET에 점수(Score)를 업데이트하거나 추가합니다. (높은 점수가 높은 랭킹)
     */
    public void updateScore(String key, Long memberId, double score) {
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();
        zSetOperations.add(key, String.valueOf(memberId), score);
    }
    
    /**
     * 특정 멤버의 현재 점수(score)를 조회합니다. (submission count 조회에 사용)
     */
    public double getScore(String key, Long memberId) {
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();
        Double score = zSetOperations.score(key, String.valueOf(memberId));
        return score != null ? score : 0.0;
    }

    /**
     * 특정 범위의 랭킹 멤버와 점수를 조회합니다.
     */
    public Set<ZSetOperations.TypedTuple<String>> getRankWithScores(String key, long start, long end) {
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();
        return zSetOperations.reverseRangeWithScores(key, start, end);
    }
}