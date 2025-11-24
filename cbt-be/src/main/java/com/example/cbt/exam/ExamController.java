package com.example.cbt.exam;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.common.ApiResponse;
import com.example.cbt.question.BatchQuestionSaveReq;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final QuestionService questionService;

    /** 시험 생성 */
    @PostMapping
    public ApiResponse<Exam> create(@RequestBody Exam exam) {
        return ApiResponse.ok(examService.create(exam));
    }

    /** 특정 시험 조회 */
    @GetMapping("/{id}")
    public ApiResponse<Exam> get(@PathVariable Long id) {
        return ApiResponse.ok(examService.get(id));
    }

    /** 공개된 시험 목록 조회 */
    @GetMapping("/published")
    public ApiResponse<List<Exam>> listPublished() {
        return ApiResponse.ok(examService.listPublished());
    }

    /** 시험 공개/비공개 전환 */
    @PatchMapping("/{id}/publish")
    public ApiResponse<Exam> publish(@PathVariable Long id, @RequestParam boolean on) {
        return ApiResponse.ok(examService.publish(id, on));
    }

    /** 특정 시험의 문제 목록 조회 */
    @GetMapping("/{id}/questions")
    public ApiResponse<List<Question>> questions(@PathVariable Long id) {
        return ApiResponse.ok(examService.getQuestions(id));
    }

    /** 
     * 시험 문제 일괄 저장 (1번 전략 포함)
     * 기존 문제 모두 삭제 후 새 문제 전체 삽입
     * 단, Attempt가 존재할 경우 수정 불가
     */
    @PutMapping("/{examId}/questions")
    public ApiResponse<Boolean> saveQuestionsBatch(
            @PathVariable Long examId,
            @RequestBody BatchQuestionSaveReq req) {

        questionService.replaceAllQuestions(examId, req.questions());
        return ApiResponse.ok(true);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Boolean> deleteExam(@PathVariable Long id) {
        examService.delete(id);
        return ApiResponse.ok(true);
    }

    @GetMapping("/{examId}/average-score")
    public ApiResponse<Double> getAverageScore(@PathVariable Long examId) {
        double avg = examService.getAverageGradedScore(examId);
        return ApiResponse.ok(avg);
    }
}
