package com.example.cbt.exam.series;

import com.example.cbt.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class ExamSeriesController {

    private final ExamSeriesRepository examSeriesRepository;
    private final ExamSeriesService examSeriesService;

    @GetMapping
    public ApiResponse<List<ExamSeries>> getAllSeries() {
        return ApiResponse.ok(examSeriesRepository.findAll());
    }

    @PostMapping
    public ApiResponse<ExamSeries> createSeries(@RequestBody ExamSeries series) {
        return ApiResponse.ok(examSeriesRepository.save(series));
    }
    
    @GetMapping("/{id}")
    public ApiResponse<ExamSeries> getSeries(@PathVariable Long id) {
        return ApiResponse.ok(examSeriesRepository.findById(id).orElseThrow());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSeries(@PathVariable Long id) {
        examSeriesService.delete(id);
        return ApiResponse.ok();
    }
}
