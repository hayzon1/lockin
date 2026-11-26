package com.lockin.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record LearningPlanDto(
        UUID id,
        UUID goalId,
        String level,
        int minutesPerDay,
        String learningStyle,
        int totalDays,
        LocalDate startDate,
        String summary,
        String provider,
        int completedCount,
        int currentDay,
        List<LearningLessonDto> lessons
) {}
