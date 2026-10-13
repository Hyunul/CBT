package com.example.cbt.attempt;

import com.example.cbt.attempt.dto.*;
import com.example.cbt.auth.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attempts")
public class AttemptController {
  private final AttemptService service;

  private Long uid(CustomUserDetails u) {
    return u == null ? null : u.getUserId();
  }

  @PostMapping("/start/{examId}")
  public ResponseEntity<Long> start(
      @PathVariable Long examId, @AuthenticationPrincipal CustomUserDetails u) {
    String key = UUID.randomUUID().toString() + UUID.randomUUID();
    Attempt a = service.startAttempt(examId, uid(u), key);
    return u == null
        ? ResponseEntity.ok().header("X-Attempt-Key", key).body(a.getId())
        : ResponseEntity.ok(a.getId());
  }

  @GetMapping("/{id}")
  public AttemptDetailRes detail(
      @PathVariable Long id,
      @AuthenticationPrincipal CustomUserDetails u,
      @RequestHeader(value = "X-Attempt-Key", required = false) String key) {
    return service.getAttemptDetail(id, uid(u), key);
  }

  @PostMapping("/{id}/answers")
  public ResponseEntity<Void> save(
      @PathVariable Long id,
      @RequestBody @Size(max = 1000) List<@Valid AnswerReq> payload,
      @AuthenticationPrincipal CustomUserDetails u,
      @RequestHeader(value = "X-Attempt-Key", required = false) String key) {
    service.saveAnswers(id, payload, uid(u), key);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/submit")
  public AttemptSubmitRes submit(
      @PathVariable Long id,
      @AuthenticationPrincipal CustomUserDetails u,
      @RequestHeader(value = "X-Attempt-Key", required = false) String key,
      @RequestBody(required = false) @Size(max = 1000) List<@Valid AnswerReq> payload) {
    return service.submitAndGrade(id, uid(u), key, payload);
  }

  @GetMapping("/{id}/result")
  public List<AttemptReviewRes> review(
      @PathVariable Long id,
      @AuthenticationPrincipal CustomUserDetails u,
      @RequestHeader(value = "X-Attempt-Key", required = false) String key) {
    return service.getReview(id, uid(u), key);
  }

  @GetMapping("/history")
  public Page<AttemptHistoryDto> history(
      @AuthenticationPrincipal CustomUserDetails u,
      @PageableDefault(size = 10, sort = "startedAt", direction = Sort.Direction.DESC)
          Pageable page) {
    return service.getAttemptHistory(u.getUserId(), page);
  }
}
