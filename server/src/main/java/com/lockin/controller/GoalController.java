package com.lockin.controller;

import com.lockin.dto.*;
import com.lockin.security.UserPrincipal;
import com.lockin.service.AtomicHabitsCoachService;
import com.lockin.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService goalService;
    private final AtomicHabitsCoachService coachService;

    public GoalController(GoalService goalService, AtomicHabitsCoachService coachService) {
        this.goalService = goalService;
        this.coachService = coachService;
    }

    @GetMapping("/coach-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCoachStatus() {
        boolean aiEnabled = coachService.isAiConfigured();
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "aiEnabled", aiEnabled,
                "activeProvider", aiEnabled ? "GEMINI" : "BUILT_IN"
        )));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LongTermGoalDto>>> getGoals(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(goalService.getUserGoals(principal)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LongTermGoalDto>> createGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGoalRequest request
    ) {
        LongTermGoalDto created = goalService.createGoal(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Long-term goal created with Atomic Habits roadmap"));
    }

    @PostMapping("/{goalId}/regenerate")
    public ResponseEntity<ApiResponse<LongTermGoalDto>> regenerateBlueprint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId
    ) {
        LongTermGoalDto updated = goalService.regenerateBlueprint(principal, goalId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Roadmap and atomic habit suggestions refreshed"));
    }

    @PostMapping("/{goalId}/milestones")
    public ResponseEntity<ApiResponse<LongTermGoalDto>> addMilestone(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody CreateMilestoneRequest request
    ) {
        LongTermGoalDto updated = goalService.addMilestone(principal, goalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(updated));
    }

    @PatchMapping("/{goalId}/milestones/{milestoneId}/toggle")
    public ResponseEntity<ApiResponse<LongTermGoalDto>> toggleMilestone(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @PathVariable UUID milestoneId
    ) {
        LongTermGoalDto updated = goalService.toggleMilestone(principal, goalId, milestoneId);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/{goalId}/status")
    public ResponseEntity<ApiResponse<LongTermGoalDto>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        LongTermGoalDto updated = goalService.updateStatus(principal, goalId, status);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PostMapping("/{goalId}/adopt-habits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adoptHabits(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody AdoptHabitsRequest request
    ) {
        Map<String, Object> result = goalService.adoptSuggestedHabits(principal, goalId, request);
        return ResponseEntity.ok(ApiResponse.success(result, "Atomic habits added to your tracking plan"));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId
    ) {
        goalService.deleteGoal(principal, goalId);
        return ResponseEntity.ok(ApiResponse.success(null, "Long-term goal deleted"));
    }
}
