package com.example.cbt.exam;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

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
import com.example.cbt.auth.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import lombok.RequiredArgsConstructor;

import com.example.cbt.exam.dto.ExamSaveReq;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final QuestionService questionService;

    /** 시험 생성 */
    @PostMapping
    public ApiResponse<Exam> create(@RequestBody ExamSaveReq req, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUserId() : 1L; // Fallback or throw
        return ApiResponse.ok(examService.create(req, userId));
    }

    @GetMapping("/list")
    public ApiResponse<ExamListRes> listExams() {
        List<Exam> popularExams = examService.getPopularExams();
        List<Long> popularExamIds = popularExams.stream().map(Exam::getId).toList();
        List<Exam> otherExams = examService.getOtherPublishedExams(popularExamIds);
        ExamListRes examListRes = new ExamListRes(popularExams, otherExams);
        return ApiResponse.ok(examListRes);
    }

    /** 특정 시험 조회 */
    @GetMapping("/{id}")
    public ApiResponse<Exam> get(@PathVariable Long id) {
        return ApiResponse.ok(examService.get(id));
    }

    /** 시리즈별 시험 조회 */
    @GetMapping
    public ApiResponse<List<Exam>> getExamsBySeries(@RequestParam(required = false) Long seriesId) {
        if (seriesId != null) {
            return ApiResponse.ok(examService.getBySeriesId(seriesId));
        }
        return ApiResponse.ok(examService.listAll());
    }

    /** 공개된 시험 목록 조회 (검색 및 페이지네이션) */
    @GetMapping("/published")
    public ApiResponse<Page<Exam>> listPublished(
            @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 9, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(examService.searchPublishedExams(search, pageable));
    }

    /** 모든 시험 목록 조회 (관리자용) */
    @GetMapping("/all")
    public ApiResponse<List<Exam>> listAll() {
        return ApiResponse.ok(examService.listAll());
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
}
