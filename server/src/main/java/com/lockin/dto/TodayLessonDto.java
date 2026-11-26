package com.lockin.dto;

import java.util.UUID;

public record TodayLessonDto(
        UUID goalId,
        String goalTitle,
        int day,
        int totalDays,
        int completedCount,
        LearningLessonDto lesson
) {}
