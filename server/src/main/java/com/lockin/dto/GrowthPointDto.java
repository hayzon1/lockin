package com.lockin.dto;

import java.time.LocalDate;

public class GrowthPointDto {
    private LocalDate date;
    private String dayOfWeek;
    private int eligibleCount;
    private int completedCount;
    private Double completionPercentage;
    private boolean future;
    private boolean elapsed;

    public GrowthPointDto() {}

    public GrowthPointDto(
            LocalDate date,
            String dayOfWeek,
            int eligibleCount,
            int completedCount,
            Double completionPercentage,
            boolean future,
            boolean elapsed
    ) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.eligibleCount = eligibleCount;
        this.completedCount = completedCount;
        this.completionPercentage = completionPercentage;
        this.future = future;
        this.elapsed = elapsed;
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

    public boolean isFuture() {
        return future;
    }

    public void setFuture(boolean future) {
        this.future = future;
    }

    public boolean isElapsed() {
        return elapsed;
    }

    public void setElapsed(boolean elapsed) {
        this.elapsed = elapsed;
    }
}
