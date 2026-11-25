package com.lockin.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class GoalMilestoneDto {
    private UUID id;
    private String title;
    private String description;
    private LocalDate targetDate;
    private int displayOrder;
    private boolean completed;
    private Instant completedAt;

    public GoalMilestoneDto() {}

    public GoalMilestoneDto(
            UUID id,
            String title,
            String description,
            LocalDate targetDate,
            int displayOrder,
            boolean completed,
            Instant completedAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.targetDate = targetDate;
        this.displayOrder = displayOrder;
        this.completed = completed;
        this.completedAt = completedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
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
