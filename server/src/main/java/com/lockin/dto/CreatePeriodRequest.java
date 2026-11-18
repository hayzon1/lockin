package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public class CreatePeriodRequest {

    @NotBlank(message = "Period name is required")
    @Size(max = 128, message = "Period name cannot exceed 128 characters")
    private String name;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer presetDays;

    private List<String> habitNames;

    public CreatePeriodRequest() {}

    public CreatePeriodRequest(String name, String description, LocalDate startDate, LocalDate endDate, List<String> habitNames) {
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.habitNames = habitNames;
    }

    public LocalDate resolveEndDate() {
        if (endDate != null) {
            return endDate;
        }
        if (presetDays != null && presetDays > 0) {
            return startDate.plusDays(presetDays - 1);
        }
        return startDate;
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

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getPresetDays() {
        return presetDays;
    }

    public void setPresetDays(Integer presetDays) {
        this.presetDays = presetDays;
    }

    public List<String> getHabitNames() {
        return habitNames;
    }

    public void setHabitNames(List<String> habitNames) {
        this.habitNames = habitNames;
    }
}
