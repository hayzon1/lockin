package com.lockin.controller;

import com.lockin.dto.ApiResponse;
import com.lockin.dto.DailyChecklistResponse;
import com.lockin.security.UserPrincipal;
import com.lockin.service.DailyTrackingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tracking")
public class TrackingController {

    private final DailyTrackingService trackingService;

    public TrackingController(DailyTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<DailyChecklistResponse>> getDailyChecklist(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DailyChecklistResponse response = trackingService.getDailyChecklist(principal, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{habitId}/{date}")
    public ResponseEntity<ApiResponse<DailyChecklistResponse>> checkHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DailyChecklistResponse response = trackingService.checkHabit(principal, habitId, date);
        return ResponseEntity.ok(ApiResponse.success(response, "Habit marked as completed"));
    }

    @DeleteMapping("/{habitId}/{date}")
    public ResponseEntity<ApiResponse<DailyChecklistResponse>> uncheckHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DailyChecklistResponse response = trackingService.uncheckHabit(principal, habitId, date);
        return ResponseEntity.ok(ApiResponse.success(response, "Habit uncompleted"));
    }
}
