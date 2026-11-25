package com.lockin.dto;

import com.lockin.entity.TaskPriority;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class TodoTaskDto {
    private UUID id;
    private String title;
    private String notes;
    private LocalDate dueDate;
    private String scheduledTime;
    private TaskPriority priority;
    private boolean completed;
    private Instant completedAt;
    private UUID goalId;
    private String goalTitle;
    private int displayOrder;
    private Instant createdAt;
    private Instant updatedAt;

    public TodoTaskDto() {}

    public TodoTaskDto(
            UUID id,
            String title,
            String notes,
            LocalDate dueDate,
            String scheduledTime,
            TaskPriority priority,
            boolean completed,
            Instant completedAt,
            UUID goalId,
            String goalTitle,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.title = title;
        this.notes = notes;
        this.dueDate = dueDate;
        this.scheduledTime = scheduledTime;
        this.priority = priority;
        this.completed = completed;
        this.completedAt = completedAt;
        this.goalId = goalId;
        this.goalTitle = goalTitle;
        this.displayOrder = displayOrder;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority;
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

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
