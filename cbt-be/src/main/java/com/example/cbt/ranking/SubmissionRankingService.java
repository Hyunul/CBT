package com.example.cbt.ranking;

import com.example.cbt.exam.ExamType;
import com.example.cbt.ranking.dto.SeriesRankDto;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionRankingService {
  private final EntityManager em;

  /** 자격증 종목(시리즈)별 풀이 횟수 = 공개된 필기 시험의 제출 완료 응시 수(비회원 포함). 실기는 세지 않는다. */
  public List<SeriesRankDto> getSeriesRanking(int limit) {
    if (limit < 1 || limit > 100) throw new IllegalArgumentException("limit must be 1..100");
    List<Object[]> rows =
        em.createQuery(
                "select s.id,s.name,count(a) from Attempt a join a.exam e join e.series s where"
                    + " a.submittedAt is not null and e.isPublished=true and e.type=:written"
                    + " group by s.id,s.name order by count(a) desc,s.id asc",
                Object[].class)
            .setParameter("written", ExamType.WRITTEN)
            .setMaxResults(limit)
            .getResultList();
    AtomicInteger rank = new AtomicInteger();
    return rows.stream()
        .map(
            r ->
                new SeriesRankDto(
                    rank.incrementAndGet(), (Long) r[0], (String) r[1], ((Number) r[2]).longValue()))
        .toList();
  }
}
