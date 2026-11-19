package com.lockin.dto;

import java.time.LocalDate;

public class PeriodOverviewAnalyticsDto {
    private int totalHabits;
    private int totalPossibleCompletions;
    private int actualCompletedEntries;
    private Double overallCompletionPercentage;
    private Double averageDailyCompletion;
    private int currentStreak;
    private int longestStreak;
    private LocalDate bestPerformingDay;
    private Double bestPerformingDayPercentage;
    private String mostConsistentHabit;
    private String leastConsistentHabit;

    public PeriodOverviewAnalyticsDto() {}

    public PeriodOverviewAnalyticsDto(
            int totalHabits,
            int totalPossibleCompletions,
            int actualCompletedEntries,
            Double overallCompletionPercentage,
            Double averageDailyCompletion,
            int currentStreak,
            int longestStreak,
            LocalDate bestPerformingDay,
            Double bestPerformingDayPercentage,
            String mostConsistentHabit,
            String leastConsistentHabit
    ) {
        this.totalHabits = totalHabits;
        this.totalPossibleCompletions = totalPossibleCompletions;
        this.actualCompletedEntries = actualCompletedEntries;
        this.overallCompletionPercentage = overallCompletionPercentage;
        this.averageDailyCompletion = averageDailyCompletion;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.bestPerformingDay = bestPerformingDay;
        this.bestPerformingDayPercentage = bestPerformingDayPercentage;
        this.mostConsistentHabit = mostConsistentHabit;
        this.leastConsistentHabit = leastConsistentHabit;
    }

    public int getTotalHabits() {
        return totalHabits;
    }

    public void setTotalHabits(int totalHabits) {
        this.totalHabits = totalHabits;
    }

    public int getTotalPossibleCompletions() {
        return totalPossibleCompletions;
    }

    public void setTotalPossibleCompletions(int totalPossibleCompletions) {
        this.totalPossibleCompletions = totalPossibleCompletions;
    }

    public int getActualCompletedEntries() {
        return actualCompletedEntries;
    }

    public void setActualCompletedEntries(int actualCompletedEntries) {
        this.actualCompletedEntries = actualCompletedEntries;
    }

    public Double getOverallCompletionPercentage() {
        return overallCompletionPercentage;
    }

    public void setOverallCompletionPercentage(Double overallCompletionPercentage) {
        this.overallCompletionPercentage = overallCompletionPercentage;
    }

    public Double getAverageDailyCompletion() {
        return averageDailyCompletion;
    }

    public void setAverageDailyCompletion(Double averageDailyCompletion) {
        this.averageDailyCompletion = averageDailyCompletion;
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

    public LocalDate getBestPerformingDay() {
        return bestPerformingDay;
    }

    public void setBestPerformingDay(LocalDate bestPerformingDay) {
        this.bestPerformingDay = bestPerformingDay;
    }

    public Double getBestPerformingDayPercentage() {
        return bestPerformingDayPercentage;
    }

    public void setBestPerformingDayPercentage(Double bestPerformingDayPercentage) {
        this.bestPerformingDayPercentage = bestPerformingDayPercentage;
    }

    public String getMostConsistentHabit() {
        return mostConsistentHabit;
    }

    public void setMostConsistentHabit(String mostConsistentHabit) {
        this.mostConsistentHabit = mostConsistentHabit;
    }

    public String getLeastConsistentHabit() {
        return leastConsistentHabit;
    }

    public void setLeastConsistentHabit(String leastConsistentHabit) {
        this.leastConsistentHabit = leastConsistentHabit;
    }
}
