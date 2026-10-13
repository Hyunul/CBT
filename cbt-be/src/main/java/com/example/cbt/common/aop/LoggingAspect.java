package com.example.cbt.common.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class LoggingAspect {
  @Around("within(com.example.cbt..*Controller)")
  public Object logExecution(ProceedingJoinPoint point) throws Throwable {
    long start = System.nanoTime();
    try {
      return point.proceed();
    } finally {
      log.debug(
          "{} completed in {}ms",
          point.getSignature().toShortString(),
          (System.nanoTime() - start) / 1_000_000);
    }
  }
}
