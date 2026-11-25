package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateHabitRequest {

    @NotBlank(message = "Habit name is required")
    @Size(max = 128, message = "Habit name cannot exceed 128 characters")
    private String name;

    private String description;

    @Size(max = 64, message = "Category cannot exceed 64 characters")
    private String category;

    private LocalDate effectiveStartDate;

    @Size(max = 255, message = "Two-minute version cannot exceed 255 characters")
    private String twoMinuteVersion;

    @Size(max = 255, message = "Habit stack cue cannot exceed 255 characters")
    private String habitStackCue;

    public CreateHabitRequest() {}

    public CreateHabitRequest(String name, String description, String category, LocalDate effectiveStartDate) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.effectiveStartDate = effectiveStartDate;
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

    public LocalDate getEffectiveStartDate() {
        return effectiveStartDate;
    }

    public void setEffectiveStartDate(LocalDate effectiveStartDate) {
        this.effectiveStartDate = effectiveStartDate;
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
