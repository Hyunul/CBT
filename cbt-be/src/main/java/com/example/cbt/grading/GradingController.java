package com.example.cbt.grading;

import com.example.cbt.attempt.Answer;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/grades")
@RequiredArgsConstructor
public class GradingController {

    private final GradingService gradingService;
    private final AnswerRepository answerRepository;

    @GetMapping("/pending")
    public ApiResponse<List<Answer>> pending() {
        // isCorrect = null 인 주관식만 노출(간단 구현)
        List<Answer> list = answerRepository.findAll().stream()
                .filter(a -> a.getIsCorrect() == null)
                .toList();
        return ApiResponse.ok(list);
    }

    public record GradeReq(boolean isCorrect, int score) {}

    @PostMapping("/{answerId}")
    public ApiResponse<Void> manual(@PathVariable Long answerId, @RequestBody GradeReq req) {
        gradingService.manualGrade(answerId, req.isCorrect(), req.score());
        return ApiResponse.ok();
    }
}
