package com.example.cbt.question;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final AttemptRepository attemptRepository;

    /** 
     * 1번 전략: Attempt 존재 시 문제 수정 금지 
     * 
     * 기존 문제 전체 삭제 후 새 문제 전체 삽입
     */
    @Transactional
    public void replaceAllQuestions(Long examId, List<QuestionCreateReq> reqList) {

        // 1) 응시 기록 확인
        if (attemptRepository.existsByExamId(examId)) {
            throw new IllegalStateException("이미 응시한 시험은 문제를 수정할 수 없습니다.");
        }

        // 2) Exam 존재 확인
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("시험을 찾을 수 없습니다: " + examId));

        // 3) 기존 문제 전체 삭제
        questionRepository.deleteByExamId(examId);

        // 4) 새 문제들 전체 Insert
        for (QuestionCreateReq req : reqList) {

            Question q = Question.builder()
                    .exam(exam)
                    .text(req.text())
                    .type(QuestionType.valueOf(req.type()))
                    .choices(req.choices())
                    .answerKey(req.answerKey())
                    .answerKeywords(req.answerKeywords())
                    .score(req.score())
                    .tags(req.tags())
                    .build();

            questionRepository.save(q);
        }
    }
}
