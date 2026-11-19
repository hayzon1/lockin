package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateHabitRequest {

    @NotBlank(message = "Habit name is required")
    @Size(max = 128, message = "Habit name cannot exceed 128 characters")
    private String name;

    private String description;

    @Size(max = 64, message = "Category cannot exceed 64 characters")
    private String category;

    private Integer displayOrder;

    public UpdateHabitRequest() {}

    public UpdateHabitRequest(String name, String description, String category, Integer displayOrder) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.displayOrder = displayOrder;
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
