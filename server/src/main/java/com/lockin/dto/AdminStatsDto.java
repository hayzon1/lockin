package com.lockin.dto;

import java.util.Map;

public class AdminStatsDto {
    private long totalUsers;
    private long verifiedUsers;
    private long totalPeriods;
    private long activePeriods;
    private long totalHabitCompletions;
    private Double overallPlatformCompletionPercentage;
    private Map<String, Long> genderDistribution;
    private Double averageAge;

    public AdminStatsDto() {}

    public AdminStatsDto(long totalUsers, long verifiedUsers, long totalPeriods, long activePeriods,
                         long totalHabitCompletions, Double overallPlatformCompletionPercentage,
                         Map<String, Long> genderDistribution, Double averageAge) {
        this.totalUsers = totalUsers;
        this.verifiedUsers = verifiedUsers;
        this.totalPeriods = totalPeriods;
        this.activePeriods = activePeriods;
        this.totalHabitCompletions = totalHabitCompletions;
        this.overallPlatformCompletionPercentage = overallPlatformCompletionPercentage;
        this.genderDistribution = genderDistribution;
        this.averageAge = averageAge;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getVerifiedUsers() {
        return verifiedUsers;
    }

    public void setVerifiedUsers(long verifiedUsers) {
        this.verifiedUsers = verifiedUsers;
    }

    public long getTotalPeriods() {
        return totalPeriods;
    }

    public void setTotalPeriods(long totalPeriods) {
        this.totalPeriods = totalPeriods;
    }

    public long getActivePeriods() {
        return activePeriods;
    }

    public void setActivePeriods(long activePeriods) {
        this.activePeriods = activePeriods;
    }

    public long getTotalHabitCompletions() {
        return totalHabitCompletions;
    }

    public void setTotalHabitCompletions(long totalHabitCompletions) {
        this.totalHabitCompletions = totalHabitCompletions;
    }

    public Double getOverallPlatformCompletionPercentage() {
        return overallPlatformCompletionPercentage;
    }

    public void setOverallPlatformCompletionPercentage(Double overallPlatformCompletionPercentage) {
        this.overallPlatformCompletionPercentage = overallPlatformCompletionPercentage;
    }

    public Map<String, Long> getGenderDistribution() {
        return genderDistribution;
    }

    public void setGenderDistribution(Map<String, Long> genderDistribution) {
        this.genderDistribution = genderDistribution;
    }

    public Double getAverageAge() {
        return averageAge;
    }

    public void setAverageAge(Double averageAge) {
        this.averageAge = averageAge;
    }
}
