package com.lockin.controller;

import com.lockin.dto.ApiResponse;
import com.lockin.dto.CreatePeriodRequest;
import com.lockin.dto.PeriodResponse;
import com.lockin.dto.UpdatePeriodRequest;
import com.lockin.security.UserPrincipal;
import com.lockin.service.PeriodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/periods")
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PeriodResponse>> createPeriod(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePeriodRequest request
    ) {
        PeriodResponse response = periodService.createPeriod(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tracking period created successfully"));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<PeriodResponse>> getActivePeriod(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PeriodResponse response = periodService.getActivePeriod(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PeriodResponse>>> getUserPeriods(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<PeriodResponse> periods = periodService.getUserPeriods(principal);
        return ResponseEntity.ok(ApiResponse.success(periods));
    }

    @GetMapping("/{periodId}")
    public ResponseEntity<ApiResponse<PeriodResponse>> getPeriodById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        PeriodResponse response = periodService.getPeriodById(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{periodId}")
    public ResponseEntity<ApiResponse<PeriodResponse>> updatePeriod(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId,
            @RequestBody UpdatePeriodRequest request
    ) {
        PeriodResponse response = periodService.updatePeriod(principal, periodId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tracking period updated successfully"));
    }

    @PostMapping("/{periodId}/complete")
    public ResponseEntity<ApiResponse<PeriodResponse>> completePeriod(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        PeriodResponse response = periodService.completePeriod(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tracking period marked as completed"));
    }
}
