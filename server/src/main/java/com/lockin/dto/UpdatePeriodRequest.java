package com.lockin.dto;

import jakarta.validation.constraints.Size;

public class UpdatePeriodRequest {

    @Size(max = 128, message = "Period name cannot exceed 128 characters")
    private String name;

    private String description;

    public UpdatePeriodRequest() {}

    public UpdatePeriodRequest(String name, String description) {
        this.name = name;
        this.description = description;
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
}
