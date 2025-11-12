package com.example.cbt.exam;

import com.example.cbt.common.ApiResponse;
import com.example.cbt.question.Question;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping
    public ApiResponse<Exam> create(@RequestBody Exam exam) {
        return ApiResponse.ok(examService.create(exam));
    }

    @GetMapping("/{id}")
    public ApiResponse<Exam> get(@PathVariable Long id) {
        return ApiResponse.ok(examService.get(id));
    }

    @GetMapping("/published")
    public ApiResponse<List<Exam>> listPublished() {
        return ApiResponse.ok(examService.listPublished());
    }

    @PatchMapping("/{id}/publish")
    public ApiResponse<Exam> publish(@PathVariable Long id, @RequestParam boolean on) {
        return ApiResponse.ok(examService.publish(id, on));
    }

    @GetMapping("/{id}/questions")
    public ApiResponse<List<Question>> questions(@PathVariable Long id) {
        return ApiResponse.ok(examService.getQuestions(id));
    }
}
