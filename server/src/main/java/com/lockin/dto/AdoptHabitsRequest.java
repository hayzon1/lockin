package com.lockin.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public class AdoptHabitsRequest {

    @NotEmpty(message = "Select at least one suggested habit to adopt")
    private List<UUID> suggestedHabitIds;

    // ADD_TO_ACTIVE_PERIOD or START_NEW_PERIOD
    private String mode = "ADD_TO_ACTIVE_PERIOD";

    // Optional overrides when mode = START_NEW_PERIOD
    private String periodName;
    private Integer presetDays = 30;
    private boolean replaceActivePeriod = false;

    public AdoptHabitsRequest() {}

    public List<UUID> getSuggestedHabitIds() {
        return suggestedHabitIds;
    }

    public void setSuggestedHabitIds(List<UUID> suggestedHabitIds) {
        this.suggestedHabitIds = suggestedHabitIds;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getPeriodName() {
        return periodName;
    }

    public void setPeriodName(String periodName) {
        this.periodName = periodName;
    }

    public Integer getPresetDays() {
        return presetDays;
    }

    public void setPresetDays(Integer presetDays) {
        this.presetDays = presetDays;
    }

    public boolean isReplaceActivePeriod() {
        return replaceActivePeriod;
    }

    public void setReplaceActivePeriod(boolean replaceActivePeriod) {
        this.replaceActivePeriod = replaceActivePeriod;
    }
}
