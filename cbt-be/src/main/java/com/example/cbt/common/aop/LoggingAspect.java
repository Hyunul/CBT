package com.example.cbt.common.aop;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    /**
     * Pointcut for all Controllers
     */
    @Pointcut("within(com.example.cbt..*Controller)")
    public void controllerPointcut() {}

    /**
     * Pointcut for all Services
     */
    @Pointcut("within(com.example.cbt..*Service)")
    public void servicePointcut() {}

    /**
     * Advice to log execution time and details for Controllers and Services
     */
    @Around("controllerPointcut() || servicePointcut()")
    public Object logExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String signature = joinPoint.getSignature().toShortString();
        String layer = getLayer(joinPoint);

        // Request logging (Only for Controllers)
        if ("Controller".equals(layer)) {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                log.info("[{}] -> Request: {} {} | Args: {}", 
                    layer, request.getMethod(), request.getRequestURI(), Arrays.toString(joinPoint.getArgs()));
            }
        } else {
            // Service Logging
            log.info("[{}] -> Method: {} | Args: {}", layer, signature, Arrays.toString(joinPoint.getArgs()));
        }

        try {
            Object result = joinPoint.proceed();
            
            long duration = System.currentTimeMillis() - startTime;
            
            // Result Logging (Truncate huge objects if necessary, here we just verify non-null for brevity or specific types)
            String resultStr = (result != null) ? result.getClass().getSimpleName() : "null";
            
            log.info("[{}] <- Return: {} | ResultType: {} | Time: {}ms", layer, signature, resultStr, duration);
            
            return result;

        } catch (Throwable throwable) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[{}] x- Exception: {} | Message: {} | Time: {}ms", layer, signature, throwable.getMessage(), duration);
            throw throwable;
        }
    }

    private String getLayer(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        if (className.endsWith("Controller")) return "Controller";
        if (className.endsWith("Service")) return "Service";
        return "Component";
    }
}