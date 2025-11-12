package com.example.cbt.attempt;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptDto;
import com.example.cbt.attempt.dto.StartReq;
import com.example.cbt.attempt.dto.SubmitRes;
import com.example.cbt.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping
    public ApiResponse<AttemptDto> start(@RequestBody StartReq req) {
        return ApiResponse.ok(attemptService.startAttempt(req.examId(), req.userId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<AttemptDto> get(@PathVariable Long id) {
        return ApiResponse.ok(attemptService.getAttempt(id));
    }

    @PostMapping("/{id}/answers")
    public ApiResponse<Void> upsertAnswers(@PathVariable Long id, @RequestBody List<AnswerReq> answers,
                                           @RequestParam Long userId) {
        attemptService.upsertAnswers(id, userId, answers);
        return ApiResponse.ok();
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<SubmitRes> submit(@PathVariable Long id, @RequestParam Long userId) {
        return ApiResponse.ok(attemptService.submitAndAutoGrade(id, userId));
    }
}
