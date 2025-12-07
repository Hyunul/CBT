package com.example.cbt.ranking;

import com.example.cbt.ranking.dto.RankDto;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionRankingService {

    private static final String RANKING_KEY_EXAM_PREFIX = "ranking:exam:";
    private static final String RANKING_KEY_SUBMISSIONS = "ranking:submissions";

    private final RankingRepository rankingRepository;
    private final UserRepository userRepository;

    /**
     * [AttemptService에서 호출됨]
     * 특정 시험의 최종 점수를 랭킹에 반영합니다. (점수 기반 랭킹)
     */
    public void updateExamRanking(Long examId, Long userId, double score) {
        String key = RANKING_KEY_EXAM_PREFIX + examId;
        // userId는 String으로 변환되어 저장됨
        rankingRepository.updateScore(key, userId, score);
    }

    /**
     * [AttemptService에서 호출됨]
     * 전체 응시 횟수 랭킹을 1 증가시킵니다. (횟수 기반 랭킹)
     */
    public void increaseSubmission(Long userId) {
        rankingRepository.incrementScore(RANKING_KEY_SUBMISSIONS, userId, 1);
    }

    /**
     * 특정 시험의 상위 N개 랭킹을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<RankDto> getExamRanking(Long examId, int limit) {
        String key = RANKING_KEY_EXAM_PREFIX + examId;
        return getRankList(key, limit);
    }

    /**
     * 전체 응시 횟수 상위 N개 랭킹을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<RankDto> getGlobalSubmissionRanking(int limit) {
        return getRankList(RANKING_KEY_SUBMISSIONS, limit);
    }

    /**
     * 공통 랭킹 조회 로직
     */
    private List<RankDto> getRankList(String key, int limit) {
        // 상위 (limit)개 조회
        Set<ZSetOperations.TypedTuple<String>> rankSet = rankingRepository.getRankWithScores(key, 0, limit - 1);

        if (rankSet == null || rankSet.isEmpty()) {
            return List.of();
        }
        
        // Redis에서 조회된 userId를 모두 추출
        List<Long> userIds = rankSet.stream()
                .map(tuple -> Long.valueOf(tuple.getValue()))
                .collect(Collectors.toList());

        // DB에서 사용자 이름 조회 (N+1 방지를 위해 in 쿼리 사용)
        List<User> users = userRepository.findAllById(userIds);

        AtomicInteger rank = new AtomicInteger(1);

        // 랭킹 데이터를 RankDto로 변환
        return rankSet.stream()
                .map(tuple -> {
                    Long userId = Long.valueOf(tuple.getValue());
                    User user = users.stream()
                            .filter(u -> u.getId().equals(userId))
                            .findFirst().orElse(null);

                    return new RankDto(
                            rank.getAndIncrement(),
                            userId,
                            user != null ? user.getUsername() : "(탈퇴 사용자)",
                            tuple.getScore()
                    );
                })
                .collect(Collectors.toList());
    }
}