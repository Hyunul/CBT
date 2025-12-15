package com.example.cbt.attempt;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.attempt.dto.AnswerReq;
import com.example.cbt.attempt.dto.AttemptDetailRes;
import com.example.cbt.attempt.dto.AttemptHistoryDto;
import com.example.cbt.attempt.dto.AttemptReviewRes;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.auth.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attempts")
public class AttemptController {

    private final AttemptService attemptService;

    // --- 1. 시험 시작 (Attempt 생성) ---
    @PostMapping("/start/{examId}")
    public ResponseEntity<Long> startAttempt(
            @PathVariable Long examId,
            // CustomUserDetails에서 Long userId를 가져올 수 있다고 가정
            @AuthenticationPrincipal CustomUserDetails userDetails) { 

        Long userId = null;
        if (userDetails != null) {
            userId = userDetails.getUserId();
        }
        Attempt attempt = attemptService.startAttempt(examId, userId);
        return ResponseEntity.ok(attempt.getId());
    }

    @PostMapping("/{attemptId}/answers")
    public ResponseEntity<Void> saveAnswers(
            @PathVariable Long attemptId,
            @RequestBody List<AnswerReq> reqList,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        attemptService.saveAnswers(attemptId, reqList, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    // --- 2. Attempt 상세 조회 (시험 진행 화면 로딩) ---
    @GetMapping("/{attemptId}")
    public ResponseEntity<AttemptDetailRes> getAttemptDetail(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttemptDetailRes detail = attemptService.getAttemptDetail(attemptId, userDetails.getUserId());
        return ResponseEntity.ok(detail);
    }

    // --- 3. Attempt 제출 및 채점 ---
    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<AttemptSubmitRes> submitAttempt(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AttemptSubmitRes result = attemptService.submitAndGrade(attemptId, userDetails.getUserId());
        return ResponseEntity.ok(result);
    }

    // --- 4. 응시 이력 조회 (개인) ---
    @GetMapping("/history")
    public ResponseEntity<Page<AttemptHistoryDto>> getAttemptHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 10, sort = "startedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Page<AttemptHistoryDto> history = attemptService.getAttemptHistory(userDetails.getUserId(), pageable);
        return ResponseEntity.ok(history);
    }

    // --- 5. 시험 결과/오답 리뷰 ---
    @GetMapping("/{attemptId}/result")
    public ResponseEntity<List<AttemptReviewRes>> getAttemptReview(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AttemptReviewRes> reviewList = attemptService.getReview(attemptId, userDetails.getUserId());
        return ResponseEntity.ok(reviewList);
    }

}