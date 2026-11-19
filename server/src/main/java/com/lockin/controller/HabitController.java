package com.lockin.controller;

import com.lockin.dto.*;
import com.lockin.security.UserPrincipal;
import com.lockin.service.HabitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @PostMapping("/periods/{periodId}/habits")
    public ResponseEntity<ApiResponse<HabitDto>> createHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId,
            @Valid @RequestBody CreateHabitRequest request
    ) {
        HabitDto habit = habitService.createHabit(principal, periodId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(habit, "Habit created successfully"));
    }

    @GetMapping("/periods/{periodId}/habits")
    public ResponseEntity<ApiResponse<List<HabitDto>>> getHabitsForPeriod(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId
    ) {
        List<HabitDto> habits = habitService.getHabitsForPeriod(principal, periodId);
        return ResponseEntity.ok(ApiResponse.success(habits));
    }

    @PutMapping("/periods/{periodId}/habits/reorder")
    public ResponseEntity<ApiResponse<List<HabitDto>>> reorderHabits(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID periodId,
            @Valid @RequestBody ReorderHabitsRequest request
    ) {
        List<HabitDto> habits = habitService.reorderHabits(principal, periodId, request);
        return ResponseEntity.ok(ApiResponse.success(habits, "Habits reordered successfully"));
    }

    @PutMapping("/habits/{habitId}")
    public ResponseEntity<ApiResponse<HabitDto>> updateHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @Valid @RequestBody UpdateHabitRequest request
    ) {
        HabitDto habit = habitService.updateHabit(principal, habitId, request);
        return ResponseEntity.ok(ApiResponse.success(habit, "Habit updated successfully"));
    }

    @PatchMapping("/habits/{habitId}/archive")
    public ResponseEntity<ApiResponse<HabitDto>> archiveHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId
    ) {
        HabitDto habit = habitService.archiveHabit(principal, habitId);
        return ResponseEntity.ok(ApiResponse.success(habit, "Habit archived successfully"));
    }
}
