package com.lockin.dto;

import java.util.UUID;

public record LearningLessonDto(
        UUID id,
        int dayNumber,
        String title,
        String description,
        String resourceTitle,
        String resourceUrl,
        String resourceType,
        int durationMinutes,
        boolean completed
) {}
