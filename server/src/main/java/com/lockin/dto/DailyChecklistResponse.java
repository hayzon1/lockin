package com.lockin.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DailyChecklistResponse {
    private LocalDate date;
    private String dayOfWeek;
    private UUID periodId;
    private String periodName;
    private List<DailyChecklistItemDto> habits;
    private int eligibleCount;
    private int completedCount;
    private Double completionPercentage;

    public DailyChecklistResponse() {}

    public DailyChecklistResponse(
            LocalDate date,
            String dayOfWeek,
            UUID periodId,
            String periodName,
            List<DailyChecklistItemDto> habits,
            int eligibleCount,
            int completedCount,
            Double completionPercentage
    ) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.periodId = periodId;
        this.periodName = periodName;
        this.habits = habits;
        this.eligibleCount = eligibleCount;
        this.completedCount = completedCount;
        this.completionPercentage = completionPercentage;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public UUID getPeriodId() {
        return periodId;
    }

    public void setPeriodId(UUID periodId) {
        this.periodId = periodId;
    }

    public String getPeriodName() {
        return periodName;
    }

    public void setPeriodName(String periodName) {
        this.periodName = periodName;
    }

    public List<DailyChecklistItemDto> getHabits() {
        return habits;
    }

    public void setHabits(List<DailyChecklistItemDto> habits) {
        this.habits = habits;
    }

    public int getEligibleCount() {
        return eligibleCount;
    }

    public void setEligibleCount(int eligibleCount) {
        this.eligibleCount = eligibleCount;
    }

    public int getCompletedCount() {
        return completedCount;
    }

    public void setCompletedCount(int completedCount) {
        this.completedCount = completedCount;
    }

    public Double getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Double completionPercentage) {
        this.completionPercentage = completionPercentage;
    }
}
