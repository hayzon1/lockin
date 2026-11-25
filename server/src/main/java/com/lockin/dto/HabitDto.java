package com.lockin.dto;

import java.time.LocalDate;
import java.util.UUID;

public class HabitDto {
    private UUID id;
    private String name;
    private String description;
    private String category;
    private int displayOrder;
    private LocalDate effectiveStartDate;
    private boolean archived;
    private UUID goalId;
    private String goalTitle;
    private String twoMinuteVersion;
    private String habitStackCue;

    public HabitDto() {}

    public HabitDto(UUID id, String name, String description, String category, int displayOrder, LocalDate effectiveStartDate, boolean archived) {
        this(id, name, description, category, displayOrder, effectiveStartDate, archived, null, null, null, null);
    }

    public HabitDto(
            UUID id,
            String name,
            String description,
            String category,
            int displayOrder,
            LocalDate effectiveStartDate,
            boolean archived,
            UUID goalId,
            String goalTitle,
            String twoMinuteVersion,
            String habitStackCue
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.displayOrder = displayOrder;
        this.effectiveStartDate = effectiveStartDate;
        this.archived = archived;
        this.goalId = goalId;
        this.goalTitle = goalTitle;
        this.twoMinuteVersion = twoMinuteVersion;
        this.habitStackCue = habitStackCue;
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

    public UUID getGoalId() {
        return goalId;
    }

    public void setGoalId(UUID goalId) {
        this.goalId = goalId;
    }

    public String getGoalTitle() {
        return goalTitle;
    }

    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public String getTwoMinuteVersion() {
        return twoMinuteVersion;
    }

    public void setTwoMinuteVersion(String twoMinuteVersion) {
        this.twoMinuteVersion = twoMinuteVersion;
    }

    public String getHabitStackCue() {
        return habitStackCue;
    }

    public void setHabitStackCue(String habitStackCue) {
        this.habitStackCue = habitStackCue;
    }
}
