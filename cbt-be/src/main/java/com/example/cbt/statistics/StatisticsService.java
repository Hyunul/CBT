package com.example.cbt.statistics;

import com.example.cbt.attempt.Attempt;
import com.example.cbt.statistics.document.AttemptDocument;
import com.example.cbt.statistics.repository.AttemptSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    // Returns average score per exam
    public List<ExamStatsDto> getExamStats() {
        // Aggregation: Terms(examTitle) -> Stats(totalScore)
        
        NativeQuery query = NativeQuery.builder()
                .withAggregation("exams", org.springframework.data.elasticsearch.client.elc.Aggregation.of(a -> a
                        .terms(t -> t.field("examTitle.keyword").size(10)) 
                        .aggregations("score_stats", sub -> sub.stats(s -> s.field("totalScore")))
                ))
                .build();

        SearchHits<AttemptDocument> searchHits = elasticsearchTemplate.search(query, AttemptDocument.class);
        
        List<ExamStatsDto> result = new ArrayList<>();
        
        if (searchHits.getAggregations() != null) {
            var examsAgg = searchHits.getAggregations().get("exams");
            
            if (examsAgg != null) {
                ((co.elastic.clients.elasticsearch._types.aggregations.StringTermsAggregate) examsAgg.aggregation().getAggregate()._get())
                        .buckets().array().forEach(bucket -> {
                            String examTitle = bucket.key().stringValue();
                            var stats = bucket.aggregations().get("score_stats").stats();
                            
                            result.add(new ExamStatsDto(
                                examTitle, 
                                stats.avg(), 
                                stats.count(), 
                                stats.min(), 
                                stats.max()
                            ));
                        });
            }
        }

        return result;
    }
    
    public record ExamStatsDto(String examTitle, double avgScore, long count, double minScore, double maxScore) {}
}
