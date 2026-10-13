package com.example.cbt.common;

import io.jsonwebtoken.JwtException;
import java.util.NoSuchElementException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ApiResponse<Void>> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.error(e.getReason()));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    MethodArgumentNotValidException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class
  })
  ResponseEntity<ApiResponse<Void>> invalid(Exception e) {
    return ResponseEntity.badRequest().body(ApiResponse.error("입력값을 확인해주세요."));
  }

  @ExceptionHandler({IllegalStateException.class, DataIntegrityViolationException.class})
  ResponseEntity<ApiResponse<Void>> conflict(Exception e) {
    return ResponseEntity.status(409).body(ApiResponse.error("현재 상태에서는 처리할 수 없거나 중복된 데이터입니다."));
  }

  @ExceptionHandler(NoSuchElementException.class)
  ResponseEntity<ApiResponse<Void>> missing(Exception e) {
    return ResponseEntity.status(404).body(ApiResponse.error("데이터를 찾을 수 없습니다."));
  }

  @ExceptionHandler(JwtException.class)
  ResponseEntity<ApiResponse<Void>> token(Exception e) {
    return ResponseEntity.status(401).body(ApiResponse.error("인증이 만료되었습니다."));
  }

  @ExceptionHandler(org.springframework.data.redis.RedisConnectionFailureException.class)
  ResponseEntity<ApiResponse<Void>> unavailable(Exception e) {
    return ResponseEntity.status(503).body(ApiResponse.error("인증 서비스를 일시적으로 사용할 수 없습니다."));
  }
}
