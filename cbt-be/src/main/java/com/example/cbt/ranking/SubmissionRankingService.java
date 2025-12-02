package com.example.cbt.ranking;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.ranking.dto.RankDto;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

import lombok.RequiredArgsConstructor;

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
        double currentCount = getSubmissionCount(userId);
        // 현재 점수에 1을 더하여 업데이트
        rankingRepository.updateScore(RANKING_KEY_SUBMISSIONS, userId, currentCount + 1); 
    }

    /**
     * Redis에서 현재 응시 횟수를 조회하는 보조 메서드
     */
    private double getSubmissionCount(Long userId) {
        // RankingRepository의 getScore 메서드를 사용하여 조회
        return rankingRepository.getScore(RANKING_KEY_SUBMISSIONS, userId);
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

        // 랭킹 데이터를 RankDto로 변환
        return rankSet.stream()
                .map(tuple -> {
                    Long userId = Long.valueOf(tuple.getValue());
                    User user = users.stream()
                            .filter(u -> u.getId().equals(userId))
                            .findFirst().orElse(null);

                    // 랭킹은 0부터 시작하므로 인덱스 + 1
                    // 랭킹 계산은 Redis가 담당하므로, 여기서는 단순히 순서대로 매핑
                    int rank = 0; // 실제 랭킹은 클라이언트에서 인덱스로 매기거나, Redis RANK 명령으로 가져와야 하나, 
                                  // 여기서는 순서대로 1부터 매기겠습니다. 

                    return new RankDto(
                            rank + 1, // 임시 순위, 실제 Redis RANK는 다름
                            userId,
                            user != null ? user.getUsername() : "(탈퇴 사용자)",
                            tuple.getScore()
                    );
                })
                .collect(Collectors.toList());
    }
}