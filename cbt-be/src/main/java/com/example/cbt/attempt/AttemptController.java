package com.example.cbt.attempt;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptCreateReq;
import com.example.cbt.attempt.dto.AttemptDetailRes;
import com.example.cbt.attempt.dto.AttemptReviewRes;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;
    private final AnswerService answerService;

    /**
     * 1. Attempt 생성 (시험 시작)
     */
    @PostMapping
    public ApiResponse<Attempt> startAttempt(@RequestBody AttemptCreateReq req) {
        Attempt attempt = attemptService.startAttempt(req.examId(), req.userId());
        return ApiResponse.ok(attempt);
    }

    /**
     * 2. Attempt 상세 조회 (문제 리스트 포함)
     *    시험 응시 화면 진입 시 사용
     */
    @GetMapping("/{attemptId}")
    public ApiResponse<AttemptDetailRes> getAttempt(@PathVariable Long attemptId) {
        return ApiResponse.ok(attemptService.getAttemptDetail(attemptId));
    }

    /**
     * 3. 임시 저장 — Answer Upsert
     */
    @PostMapping("/{attemptId}/answers")
    public ApiResponse<Boolean> saveAnswers(
            @PathVariable Long attemptId,
            @RequestBody List<AnswerReq> answers
    ) {
        answerService.saveAnswers(attemptId, answers);
        return ApiResponse.ok(true);
    }

    /**
     * 4. 제출 + 자동 채점 (status: IN_PROGRESS → SUBMITTED → GRADED)
     */
    @PostMapping("/{attemptId}/submit")
    public ApiResponse<AttemptSubmitRes> submitAttempt(@PathVariable Long attemptId) {
        AttemptSubmitRes result = attemptService.submitAndGrade(attemptId);
        return ApiResponse.ok(result);
    }

    @GetMapping("/{attemptId}/review")
    public ApiResponse<List<AttemptReviewRes>> review(@PathVariable Long attemptId) {
        return ApiResponse.ok(attemptService.getReview(attemptId));
    }
}
