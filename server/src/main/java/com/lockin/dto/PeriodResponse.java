package com.lockin.dto;

import com.lockin.entity.PeriodStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PeriodResponse {
    private UUID id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private PeriodStatus status;
    private long totalDays;
    private long daysElapsed;
    private long daysRemaining;
    private List<HabitDto> habits;
    private Instant createdAt;
    private Instant updatedAt;

    public PeriodResponse() {}

    public PeriodResponse(
            UUID id,
            String name,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            PeriodStatus status,
            long totalDays,
            long daysElapsed,
            long daysRemaining,
            List<HabitDto> habits,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.totalDays = totalDays;
        this.daysElapsed = daysElapsed;
        this.daysRemaining = daysRemaining;
        this.habits = habits;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public PeriodStatus getStatus() {
        return status;
    }

    public void setStatus(PeriodStatus status) {
        this.status = status;
    }

    public long getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(long totalDays) {
        this.totalDays = totalDays;
    }

    public long getDaysElapsed() {
        return daysElapsed;
    }

    public void setDaysElapsed(long daysElapsed) {
        this.daysElapsed = daysElapsed;
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public List<HabitDto> getHabits() {
        return habits;
    }

    public void setHabits(List<HabitDto> habits) {
        this.habits = habits;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
