package com.lockin.controller;

import com.lockin.dto.ApiResponse;
import com.lockin.dto.LearningPlanDto;
import com.lockin.dto.LearningPlanRequest;
import com.lockin.dto.TodayLessonDto;
import com.lockin.security.UserPrincipal;
import com.lockin.service.LearningPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LearningPlanController {

    private final LearningPlanService learningPlanService;

    public LearningPlanController(LearningPlanService learningPlanService) {
        this.learningPlanService = learningPlanService;
    }

    @GetMapping("/goals/{goalId}/learning-plan")
    public ResponseEntity<ApiResponse<LearningPlanDto>> getPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId
    ) {
        return ResponseEntity.ok(ApiResponse.success(learningPlanService.getPlan(principal, goalId).orElse(null)));
    }

    @PostMapping("/goals/{goalId}/learning-plan")
    public ResponseEntity<ApiResponse<LearningPlanDto>> generate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody LearningPlanRequest request
    ) {
        LearningPlanDto plan = learningPlanService.generate(principal, goalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(plan, "Learning plan ready"));
    }

    @PatchMapping("/goals/{goalId}/learning-plan/lessons/{lessonId}/toggle")
    public ResponseEntity<ApiResponse<LearningPlanDto>> toggle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @PathVariable UUID lessonId
    ) {
        return ResponseEntity.ok(ApiResponse.success(learningPlanService.toggleLesson(principal, goalId, lessonId)));
    }

    @DeleteMapping("/goals/{goalId}/learning-plan")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId
    ) {
        learningPlanService.deletePlan(principal, goalId);
        return ResponseEntity.ok(ApiResponse.success(null, "Learning plan removed"));
    }

    @GetMapping("/learning/today")
    public ResponseEntity<ApiResponse<List<TodayLessonDto>>> today(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(learningPlanService.today(principal)));
    }
}
