package com.example.cbt.statistics.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(indexName = "attempts")
public class AttemptDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long examId;

    @Field(type = FieldType.Text, fielddata = true)
    private String examTitle;

    @Field(type = FieldType.Long)
    private Long userId; // Can be null for guest

    @Field(type = FieldType.Integer)
    private Integer totalScore;

    @Field(type = FieldType.Date)
    private Instant submittedAt;
}
