package com.example.cbt.attempt;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AnswerReq;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final AttemptRepository attemptRepository;
    
    @Transactional
    public void saveAnswers(Long attemptId, List<AnswerReq> reqList) {

        // 1. Attempt 객체를 먼저 조회 (필수)
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found with id: " + attemptId));

        for (AnswerReq req : reqList) {

            // 2. [수정됨]: Attempt ID와 Question ID로 기존 답변을 조회합니다.
            Answer answer = answerRepository
                    .findByAttemptIdAndQuestionId(attemptId, req.questionId())
                    .orElse(Answer.builder()
                            // 3. [수정됨]: ID 대신 Attempt 엔티티 객체를 설정합니다.
                            .attempt(attempt) 
                            .questionId(req.questionId())
                            .build());

            // 4. 답변 내용 업데이트
            answer.setSelectedChoices(req.selectedChoices());
            answer.setResponseText(req.responseText());

            // 5. 저장 (JPA Persist/Merge)
            answerRepository.save(answer);
        }
    }
}
