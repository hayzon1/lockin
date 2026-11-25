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
    private UUID goalId;
    private String goalTitle;
    private String twoMinuteVersion;
    private String habitStackCue;

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
        this(habitId, name, description, category, displayOrder, completed, completedAt, null, null, null, null);
    }

    public DailyChecklistItemDto(
            UUID habitId,
            String name,
            String description,
            String category,
            int displayOrder,
            boolean completed,
            Instant completedAt,
            UUID goalId,
            String goalTitle,
            String twoMinuteVersion,
            String habitStackCue
    ) {
        this.habitId = habitId;
        this.name = name;
        this.description = description;
        this.category = category;
        this.displayOrder = displayOrder;
        this.completed = completed;
        this.completedAt = completedAt;
        this.goalId = goalId;
        this.goalTitle = goalTitle;
        this.twoMinuteVersion = twoMinuteVersion;
        this.habitStackCue = habitStackCue;
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

    public UUID getGoalId() {
        return goalId;
    }

    public void setGoalId(UUID goalId) {
        this.goalId = goalId;
    }

    public String getGoalTitle() {
        return goalTitle;
    }

    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public String getTwoMinuteVersion() {
        return twoMinuteVersion;
    }

    public void setTwoMinuteVersion(String twoMinuteVersion) {
        this.twoMinuteVersion = twoMinuteVersion;
    }

    public String getHabitStackCue() {
        return habitStackCue;
    }

    public void setHabitStackCue(String habitStackCue) {
        this.habitStackCue = habitStackCue;
    }
}
