package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateMilestoneRequest {

    @NotBlank(message = "Milestone title is required")
    @Size(max = 160, message = "Milestone title cannot exceed 160 characters")
    private String title;

    private String description;

    private LocalDate targetDate;

    public CreateMilestoneRequest() {}

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
}
