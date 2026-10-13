package com.example.cbt.exam.series;

import com.example.cbt.common.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class ExamSeriesController {
  public record SeriesRequest(
      @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100)
          String name,
      @jakarta.validation.constraints.Size(max = 500) String description) {}

  private final ExamSeriesRepository examSeriesRepository;
  private final ExamSeriesService examSeriesService;

  @GetMapping
  public ApiResponse<List<ExamSeries>> getAllSeries() {
    return ApiResponse.ok(examSeriesRepository.findAll());
  }

  @PostMapping
  public ApiResponse<ExamSeries> createSeries(
      @jakarta.validation.Valid @RequestBody SeriesRequest series) {
    return ApiResponse.ok(
        examSeriesRepository.save(
            ExamSeries.builder().name(series.name()).description(series.description()).build()));
  }

  @PutMapping("/{id}")
  public ApiResponse<ExamSeries> updateSeries(
      @PathVariable Long id, @jakarta.validation.Valid @RequestBody SeriesRequest series) {
    return ApiResponse.ok(examSeriesService.update(id, series.name(), series.description()));
  }

  @GetMapping("/{id}")
  public ApiResponse<ExamSeries> getSeries(@PathVariable Long id) {
    return ApiResponse.ok(examSeriesRepository.findById(id).orElseThrow());
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteSeries(
      @PathVariable Long id, @RequestParam(defaultValue = "false") boolean force) {
    examSeriesService.delete(id, force);
    return ApiResponse.ok();
  }
}
