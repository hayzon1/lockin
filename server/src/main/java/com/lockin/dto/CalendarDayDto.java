package com.lockin.dto;

import java.time.LocalDate;

public class CalendarDayDto {
    private LocalDate date;
    private int dayOfMonth;
    private boolean inPeriod;
    private int eligibleCount;
    private int completedCount;
    private Double completionPercentage;
    private int intensity; // 0 to 4
    private boolean future;
    private boolean today;

    public CalendarDayDto() {}

    public CalendarDayDto(
            LocalDate date,
            int dayOfMonth,
            boolean inPeriod,
            int eligibleCount,
            int completedCount,
            Double completionPercentage,
            int intensity,
            boolean future,
            boolean today
    ) {
        this.date = date;
        this.dayOfMonth = dayOfMonth;
        this.inPeriod = inPeriod;
        this.eligibleCount = eligibleCount;
        this.completedCount = completedCount;
        this.completionPercentage = completionPercentage;
        this.intensity = intensity;
        this.future = future;
        this.today = today;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getDayOfMonth() {
        return dayOfMonth;
    }

    public void setDayOfMonth(int dayOfMonth) {
        this.dayOfMonth = dayOfMonth;
    }

    public boolean isInPeriod() {
        return inPeriod;
    }

    public void setInPeriod(boolean inPeriod) {
        this.inPeriod = inPeriod;
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

    public int getIntensity() {
        return intensity;
    }

    public void setIntensity(int intensity) {
        this.intensity = intensity;
    }

    public boolean isFuture() {
        return future;
    }

    public void setFuture(boolean future) {
        this.future = future;
    }

    public boolean isToday() {
        return today;
    }

    public void setToday(boolean today) {
        this.today = today;
    }
}
