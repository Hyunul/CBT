package com.example.cbt.ranking;

import com.example.cbt.ranking.dto.RankDto;
import jakarta.persistence.EntityManager;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionRankingService {
  private final EntityManager em;

  public List<RankDto> getExamRanking(Long examId, int limit) {
    var query =
        em.createQuery(
                "select u.id,u.username,max(a.totalScore) from Attempt a join a.user u where"
                    + " a.submittedAt is not null and a.exam.id=:exam and a.exam.isPublished=true"
                    + " group by u.id,u.username order by max(a.totalScore) desc,u.id asc",
                Object[].class)
            .setParameter("exam", examId);
    return ranks(query.setMaxResults(bounded(limit)).getResultList());
  }

  public List<RankDto> getGlobalSubmissionRanking(int limit) {
    return ranks(
        em.createQuery(
                "select u.id,u.username,count(a) from Attempt a join a.user u where a.submittedAt"
                    + " is not null and a.exam.isPublished=true group by u.id,u.username order by"
                    + " count(a) desc,u.id asc",
                Object[].class)
            .setMaxResults(bounded(limit))
            .getResultList());
  }

  private int bounded(int limit) {
    if (limit < 1 || limit > 100) throw new IllegalArgumentException("limit must be 1..100");
    return limit;
  }

  private List<RankDto> ranks(List<Object[]> rows) {
    AtomicInteger rank = new AtomicInteger();
    return rows.stream()
        .map(
            r ->
                new RankDto(
                    rank.incrementAndGet(),
                    (Long) r[0],
                    (String) r[1],
                    ((Number) r[2]).doubleValue()))
        .toList();
  }
}
