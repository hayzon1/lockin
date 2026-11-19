package com.lockin.controller;

import com.lockin.dto.*;
import com.lockin.security.UserPrincipal;
import com.lockin.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics/period/{periodId}")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/growth")
    public ResponseEntity<ApiResponse<List<GrowthPointDto>>> getGrowthTrajectory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        List<GrowthPointDto> trajectory = analyticsService.getGrowthTrajectory(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(trajectory));
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<PeriodOverviewAnalyticsDto>> getPeriodOverview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        PeriodOverviewAnalyticsDto overview = analyticsService.getPeriodOverview(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/habits")
    public ResponseEntity<ApiResponse<List<HabitAnalyticsDto>>> getHabitsAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        List<HabitAnalyticsDto> habits = analyticsService.getHabitsAnalytics(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(habits));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<List<InsightDto>>> getInsights(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        List<InsightDto> insights = analyticsService.getInsights(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(insights));
    }
}
