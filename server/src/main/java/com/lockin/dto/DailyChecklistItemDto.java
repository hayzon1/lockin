package com.lockin.dto;

import java.time.Instant;
import java.util.UUID;

public class DailyChecklistItemDto {
    private UUID habitId;
    private String name;
    private String description;
    private String category;
    private int displayOrder;
    private boolean completed;
    private Instant completedAt;

    public DailyChecklistItemDto() {}

    public DailyChecklistItemDto(
            UUID habitId,
            String name,
            String description,
            String category,
            int displayOrder,
            boolean completed,
            Instant completedAt
    ) {
        this.habitId = habitId;
        this.name = name;
        this.description = description;
        this.category = category;
        this.displayOrder = displayOrder;
        this.completed = completed;
        this.completedAt = completedAt;
    }

    public UUID getHabitId() {
        return habitId;
    }

    public void setHabitId(UUID habitId) {
        this.habitId = habitId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
