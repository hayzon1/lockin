package com.lockin.dto;

import java.util.UUID;

public class GoalSuggestedHabitDto {
    private UUID id;
    private String name;
    private String twoMinuteVersion;
    private String habitStackCue;
    private String category;
    private String whyItWorks;
    private int displayOrder;
    private boolean adopted;

    public GoalSuggestedHabitDto() {}

    public GoalSuggestedHabitDto(
            UUID id,
            String name,
            String twoMinuteVersion,
            String habitStackCue,
            String category,
            String whyItWorks,
            int displayOrder,
            boolean adopted
    ) {
        this.id = id;
        this.name = name;
        this.twoMinuteVersion = twoMinuteVersion;
        this.habitStackCue = habitStackCue;
        this.category = category;
        this.whyItWorks = whyItWorks;
        this.displayOrder = displayOrder;
        this.adopted = adopted;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getWhyItWorks() {
        return whyItWorks;
    }

    public void setWhyItWorks(String whyItWorks) {
        this.whyItWorks = whyItWorks;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public boolean isAdopted() {
        return adopted;
    }

    public void setAdopted(boolean adopted) {
        this.adopted = adopted;
    }
}
