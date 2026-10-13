package com.example.cbt.config;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** 문제 본문의 [이미지: 파일명] 이 가리키는 파일을 디렉터리에서 그대로 서빙한다. */
@Configuration
public class QuestionImageConfig implements WebMvcConfigurer {

  @Value("${app.question-images-dir:./question-images}")
  private String dir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/api/question-images/**")
        .addResourceLocations(Path.of(dir).toAbsolutePath().normalize().toUri().toString());
  }
}
