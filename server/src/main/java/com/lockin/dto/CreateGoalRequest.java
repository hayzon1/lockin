package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateGoalRequest {

    @NotBlank(message = "Goal title is required")
    @Size(max = 160, message = "Goal title cannot exceed 160 characters")
    private String title;

    private String description;

    @Size(max = 64, message = "Category cannot exceed 64 characters")
    private String category;

    @Size(max = 255, message = "Identity statement cannot exceed 255 characters")
    private String identityStatement;

    @NotNull(message = "Target date is required")
    private LocalDate targetDate;

    public CreateGoalRequest() {}

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIdentityStatement() {
        return identityStatement;
    }

    public void setIdentityStatement(String identityStatement) {
        this.identityStatement = identityStatement;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }
}
