package com.example.cbt.statistics.repository;

import com.example.cbt.statistics.document.AttemptDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface AttemptSearchRepository extends ElasticsearchRepository<AttemptDocument, Long> {
}
