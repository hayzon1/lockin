package com.lockin.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "long_term_goals")
public class LongTermGoalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 64)
    private String category = "PERSONAL";

    @Column(name = "identity_statement", length = 255)
    private String identityStatement;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GoalStatus status = GoalStatus.ACTIVE;

    @Column(name = "ai_provider", nullable = false, length = 32)
    private String aiProvider = "BUILT_IN";

    @Column(name = "roadmap_summary", columnDefinition = "TEXT")
    private String roadmapSummary;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<GoalMilestoneEntity> milestones = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<GoalSuggestedHabitEntity> suggestedHabits = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public LongTermGoalEntity() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
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

    public List<GoalMilestoneEntity> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<GoalMilestoneEntity> milestones) {
        this.milestones = milestones;
    }

    public List<GoalSuggestedHabitEntity> getSuggestedHabits() {
        return suggestedHabits;
    }

    public void setSuggestedHabits(List<GoalSuggestedHabitEntity> suggestedHabits) {
        this.suggestedHabits = suggestedHabits;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
