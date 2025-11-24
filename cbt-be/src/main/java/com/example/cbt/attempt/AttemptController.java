package com.example.cbt.attempt;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptResultRes;
import com.example.cbt.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;
    private final AnswerService answerService;
    
    /** 결과 조회 */
    @GetMapping("/{attemptId}/result")
    public ApiResponse<AttemptResultRes> result(@PathVariable Long attemptId) {
        return ApiResponse.ok(attemptService.getResult(attemptId));
}

    /** 임시 저장 (답안 저장) */
    @PostMapping("/{attemptId}/answers")
    public ApiResponse<Boolean> saveAnswers(
            @PathVariable Long attemptId,
            @RequestBody List<AnswerReq> answers
    ) {
        answerService.saveAnswers(attemptId, answers);
        return ApiResponse.ok(true);
    }

    /** 제출 */
    @PostMapping("/{attemptId}/submit")
    public ApiResponse<Boolean> submit(@PathVariable Long attemptId) {
        attemptService.submitAndGrade(attemptId);
        return ApiResponse.ok(true);
    }
}
