package com.example.cbt.attempt;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AnswerReq;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnswerService {

    private final AnswerRepository answerRepository;

    @Transactional
    public void saveAnswers(Long attemptId, List<AnswerReq> reqList) {

        for (AnswerReq req : reqList) {

            Answer answer = answerRepository
                    .findByAttemptIdAndQuestionId(attemptId, req.questionId())
                    .orElse(Answer.builder()
                            .attemptId(attemptId)
                            .questionId(req.questionId())
                            .build());

            answer.setSelectedChoices(req.selectedChoices());
            answer.setResponseText(req.responseText());

            answerRepository.save(answer);
        }
    }
}
