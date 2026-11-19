package com.lockin.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class HabitAnalyticsDto {
    private UUID habitId;
    private String name;
    private String category;
    private int totalCompletions;
    private int eligibleDays;
    private Double completionPercentage;
    private int currentStreak;
    private int longestStreak;
    private List<LocalDate> completionDates;

    public HabitAnalyticsDto() {}

    public HabitAnalyticsDto(
            UUID habitId,
            String name,
            String category,
            int totalCompletions,
            int eligibleDays,
            Double completionPercentage,
            int currentStreak,
            int longestStreak,
            List<LocalDate> completionDates
    ) {
        this.habitId = habitId;
        this.name = name;
        this.category = category;
        this.totalCompletions = totalCompletions;
        this.eligibleDays = eligibleDays;
        this.completionPercentage = completionPercentage;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.completionDates = completionDates;
    }

    public UUID getHabitId() {
        return habitId;
    }

    public void setHabitId(UUID habitId) {
        this.habitId = habitId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getTotalCompletions() {
        return totalCompletions;
    }

    public void setTotalCompletions(int totalCompletions) {
        this.totalCompletions = totalCompletions;
    }

    public int getEligibleDays() {
        return eligibleDays;
    }

    public void setEligibleDays(int eligibleDays) {
        this.eligibleDays = eligibleDays;
    }

    public Double getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Double completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public List<LocalDate> getCompletionDates() {
        return completionDates;
    }

    public void setCompletionDates(List<LocalDate> completionDates) {
        this.completionDates = completionDates;
    }
}
