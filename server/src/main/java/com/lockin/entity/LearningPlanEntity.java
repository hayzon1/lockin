package com.lockin.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goal_learning_plans")
public class LearningPlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "goal_id", nullable = false, unique = true)
    private UUID goalId;

    @Column(nullable = false, length = 32)
    private String level;

    @Column(name = "minutes_per_day", nullable = false)
    private int minutesPerDay;

    @Column(name = "learning_style", nullable = false, length = 32)
    private String learningStyle;

    @Column(name = "total_days", nullable = false)
    private int totalDays;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, length = 32)
    private String provider = "BUILT_IN";

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC")
    private List<LearningLessonEntity> lessons = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public int getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(int minutesPerDay) { this.minutesPerDay = minutesPerDay; }
    public String getLearningStyle() { return learningStyle; }
    public void setLearningStyle(String learningStyle) { this.learningStyle = learningStyle; }
    public int getTotalDays() { return totalDays; }
    public void setTotalDays(int totalDays) { this.totalDays = totalDays; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public List<LearningLessonEntity> getLessons() { return lessons; }
}
