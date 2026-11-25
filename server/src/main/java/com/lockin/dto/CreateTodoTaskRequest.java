package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class CreateTodoTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Task title cannot exceed 200 characters")
    private String title;

    private String notes;

    private LocalDate dueDate;

    @Size(max = 10, message = "Scheduled time cannot exceed 10 characters")
    private String scheduledTime;

    private String priority = "MEDIUM";

    private UUID goalId;

    public CreateTodoTaskRequest() {}

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

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public UUID getGoalId() {
        return goalId;
    }

    public void setGoalId(UUID goalId) {
        this.goalId = goalId;
    }
}
