package com.lockin.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "habits")
public class HabitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private TrackingPeriodEntity period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private LongTermGoalEntity goal;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 64)
    private String category;

    @Column(name = "two_minute_version", length = 255)
    private String twoMinuteVersion;

    @Column(name = "habit_stack_cue", length = 255)
    private String habitStackCue;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "effective_start_date", nullable = false)
    private LocalDate effectiveStartDate;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public HabitEntity() {}

    public HabitEntity(UserEntity user, TrackingPeriodEntity period, String name, LocalDate effectiveStartDate, int displayOrder) {
        this.user = user;
        this.period = period;
        this.name = name;
        this.effectiveStartDate = effectiveStartDate;
        this.displayOrder = displayOrder;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isArchived() {
        return archivedAt != null;
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

    public TrackingPeriodEntity getPeriod() {
        return period;
    }

    public void setPeriod(TrackingPeriodEntity period) {
        this.period = period;
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

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public LongTermGoalEntity getGoal() {
        return goal;
    }

    public void setGoal(LongTermGoalEntity goal) {
        this.goal = goal;
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
