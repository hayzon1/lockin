package com.lockin.dto;

import com.lockin.entity.GoalStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class LongTermGoalDto {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private String identityStatement;
    private LocalDate targetDate;
    private long daysRemaining;
    private GoalStatus status;
    private String aiProvider;
    private String roadmapSummary;
    private List<GoalMilestoneDto> milestones;
    private List<GoalSuggestedHabitDto> suggestedHabits;
    private int linkedHabitsCount;
    private long identityVotesCount;
    private int progressPercentage;
    private Instant createdAt;
    private Instant updatedAt;

    public LongTermGoalDto() {}

    public LongTermGoalDto(
            UUID id,
            String title,
            String description,
            String category,
            String identityStatement,
            LocalDate targetDate,
            long daysRemaining,
            GoalStatus status,
            String aiProvider,
            String roadmapSummary,
            List<GoalMilestoneDto> milestones,
            List<GoalSuggestedHabitDto> suggestedHabits,
            int linkedHabitsCount,
            long identityVotesCount,
            int progressPercentage,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.identityStatement = identityStatement;
        this.targetDate = targetDate;
        this.daysRemaining = daysRemaining;
        this.status = status;
        this.aiProvider = aiProvider;
        this.roadmapSummary = roadmapSummary;
        this.milestones = milestones;
        this.suggestedHabits = suggestedHabits;
        this.linkedHabitsCount = linkedHabitsCount;
        this.identityVotesCount = identityVotesCount;
        this.progressPercentage = progressPercentage;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getIdentityStatement() {
        return identityStatement;
    }

    public void setIdentityStatement(String identityStatement) {
        this.identityStatement = identityStatement;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public GoalStatus getStatus() {
        return status;
    }

    public void setStatus(GoalStatus status) {
        this.status = status;
    }

    public String getAiProvider() {
        return aiProvider;
    }

    public void setAiProvider(String aiProvider) {
        this.aiProvider = aiProvider;
    }

    public String getRoadmapSummary() {
        return roadmapSummary;
    }

    public void setRoadmapSummary(String roadmapSummary) {
        this.roadmapSummary = roadmapSummary;
    }

    public List<GoalMilestoneDto> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<GoalMilestoneDto> milestones) {
        this.milestones = milestones;
    }

    public List<GoalSuggestedHabitDto> getSuggestedHabits() {
        return suggestedHabits;
    }

    public void setSuggestedHabits(List<GoalSuggestedHabitDto> suggestedHabits) {
        this.suggestedHabits = suggestedHabits;
    }

    public int getLinkedHabitsCount() {
        return linkedHabitsCount;
    }

    public void setLinkedHabitsCount(int linkedHabitsCount) {
        this.linkedHabitsCount = linkedHabitsCount;
    }

    public long getIdentityVotesCount() {
        return identityVotesCount;
    }

    public void setIdentityVotesCount(long identityVotesCount) {
        this.identityVotesCount = identityVotesCount;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = progressPercentage;
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
