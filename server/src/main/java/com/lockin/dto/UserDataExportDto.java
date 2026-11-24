package com.lockin.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class UserDataExportDto {
    private Instant exportedAt;
    private UserDto user;
    private List<PeriodExportDto> periods;

    public UserDataExportDto() {}

    public UserDataExportDto(Instant exportedAt, UserDto user, List<PeriodExportDto> periods) {
        this.exportedAt = exportedAt;
        this.user = user;
        this.periods = periods;
    }

    public Instant getExportedAt() {
        return exportedAt;
    }

    public void setExportedAt(Instant exportedAt) {
        this.exportedAt = exportedAt;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }

    public List<PeriodExportDto> getPeriods() {
        return periods;
    }

    public void setPeriods(List<PeriodExportDto> periods) {
        this.periods = periods;
    }

    public static class PeriodExportDto {
        private UUID id;
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private List<HabitExportDto> habits;

        public PeriodExportDto() {}

        public PeriodExportDto(UUID id, String name, String description, LocalDate startDate, LocalDate endDate, String status, List<HabitExportDto> habits) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.startDate = startDate;
            this.endDate = endDate;
            this.status = status;
            this.habits = habits;
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

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public List<HabitExportDto> getHabits() {
            return habits;
        }

        public void setHabits(List<HabitExportDto> habits) {
            this.habits = habits;
        }
    }

    public static class HabitExportDto {
        private UUID id;
        private String name;
        private String description;
        private String category;
        private int displayOrder;
        private LocalDate effectiveStartDate;
        private boolean archived;
        private List<LocalDate> completions;

        public HabitExportDto() {}

        public HabitExportDto(UUID id, String name, String description, String category, int displayOrder, LocalDate effectiveStartDate, boolean archived, List<LocalDate> completions) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.category = category;
            this.displayOrder = displayOrder;
            this.effectiveStartDate = effectiveStartDate;
            this.archived = archived;
            this.completions = completions;
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

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public int getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(int displayOrder) {
            this.displayOrder = displayOrder;
        }

        public LocalDate getEffectiveStartDate() {
            return effectiveStartDate;
        }

        public void setEffectiveStartDate(LocalDate effectiveStartDate) {
            this.effectiveStartDate = effectiveStartDate;
        }

        public boolean isArchived() {
            return archived;
        }

        public void setArchived(boolean archived) {
            this.archived = archived;
        }

        public List<LocalDate> getCompletions() {
            return completions;
        }

        public void setCompletions(List<LocalDate> completions) {
            this.completions = completions;
        }
    }
}
