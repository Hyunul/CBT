package com.example.cbt.common.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Pointcut("within(com.example.cbt..*Controller)")
    public void controller() {}

    @Around("controller()")
    public Object logPerformance(ProceedingJoinPoint pjp) throws Throwable {
        long startTime = System.currentTimeMillis();

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();

        log.info(
            "[REQUEST] {} {} | args={}",
            request.getMethod(),
            request.getRequestURI(),
            Arrays.toString(pjp.getArgs())
        );
        
        try {
            Object result = pjp.proceed();
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            log.info(
                "[RESPONSE] {} {} | result={} | duration={}ms",
                request.getMethod(),
                request.getRequestURI(),
                result,
                duration
            );
            
            return result;
        } catch (Throwable throwable) {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            log.error(
                "[ERROR] {} {} | error={} | duration={}ms",
                request.getMethod(),
                request.getRequestURI(),
                throwable.getMessage(),
                duration,
                throwable
            );
            throw throwable;
        }
    }
}
