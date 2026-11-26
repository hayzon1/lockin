package com.lockin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** What the learner tells us before the plan is built. All fields are optional and get sensible defaults. */
public record LearningPlanRequest(
        String level,
        @Min(10) @Max(240) Integer minutesPerDay,
        String learningStyle,
        @Min(7) @Max(90) Integer days
) {}
