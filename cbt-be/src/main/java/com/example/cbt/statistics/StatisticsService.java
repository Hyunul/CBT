package com.example.cbt.statistics;

import com.example.cbt.attempt.Attempt;
import com.example.cbt.statistics.document.AttemptDocument;
import com.example.cbt.statistics.repository.AttemptSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import co.elastic.clients.elasticsearch._types.aggregations.Aggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsAggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StatsAggregate;

import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final AttemptSearchRepository attemptSearchRepository;
    private final ElasticsearchTemplate elasticsearchTemplate;

    public void indexAttempt(Attempt attempt) {
        try {
            AttemptDocument doc = AttemptDocument.builder()
                    .id(attempt.getId())
                    .examId(attempt.getExam().getId())
                    .examTitle(attempt.getExam().getTitle())
                    .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                    .totalScore(attempt.getTotalScore())
                    .submittedAt(attempt.getSubmittedAt())
                    .build();

            attemptSearchRepository.save(doc);
            log.info("Indexed attempt {} to Elasticsearch", attempt.getId());
        } catch (Exception e) {
            log.error("Failed to index attempt to Elasticsearch", e);
        }
    }

    public List<ExamStatsDto> getExamStats() {
        NativeQuery query = NativeQuery.builder()
                .withAggregation("exams",
                        co.elastic.clients.elasticsearch._types.aggregations.Aggregation.of(a -> a
                                .terms(t -> t.field("examTitle.keyword").size(10))
                                .aggregations("score_stats", sub -> sub.stats(s -> s.field("totalScore")))
                        )
                )
                .build();

        SearchHits<AttemptDocument> searchHits = elasticsearchTemplate.search(query, AttemptDocument.class);

        List<ExamStatsDto> result = new ArrayList<>();

        var aggsContainer = searchHits.getAggregations();
        if (!(aggsContainer instanceof ElasticsearchAggregations aggs)) {
            return result;
        }

        ElasticsearchAggregation examsAggContainer = aggs.get("exams");
        if (examsAggContainer == null) {
            return result;
        }

        org.springframework.data.elasticsearch.client.elc.Aggregation springAgg = examsAggContainer.aggregation();
        if (springAgg == null) {
            return result;
        }

        Aggregate aggregate = springAgg.getAggregate();
        if (aggregate == null || !aggregate.isSterms()) {
            return result;
        }

        StringTermsAggregate termsAgg = aggregate.sterms();
        if (termsAgg.buckets() == null || termsAgg.buckets().array() == null) {
            return result;
        }

        termsAgg.buckets().array().forEach(bucket -> {
            String examTitle = bucket.key() != null ? bucket.key().stringValue() : null;
            if (examTitle == null) return;

            Aggregate scoreStatsAgg = bucket.aggregations() != null ? bucket.aggregations().get("score_stats") : null;
            if (scoreStatsAgg != null && scoreStatsAgg.isStats()) {
                StatsAggregate stats = scoreStatsAgg.stats();
                long count = stats.count();

                result.add(new ExamStatsDto(
                        examTitle,
                        stats.avg(),
                        count,
                        count > 0 ? stats.min() : 0.0,
                        count > 0 ? stats.max() : 0.0
                ));
            }
        });

        return result;
    }

    public record ExamStatsDto(String examTitle, double avgScore, long count, double minScore, double maxScore) {}
}
