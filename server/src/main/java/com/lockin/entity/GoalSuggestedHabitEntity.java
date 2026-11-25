package com.lockin.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "goal_suggested_habits")
public class GoalSuggestedHabitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private LongTermGoalEntity goal;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "two_minute_version", length = 255)
    private String twoMinuteVersion;

    @Column(name = "habit_stack_cue", length = 255)
    private String habitStackCue;

    @Column(length = 64)
    private String category;

    @Column(name = "why_it_works", columnDefinition = "TEXT")
    private String whyItWorks;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(nullable = false)
    private boolean adopted = false;

    public GoalSuggestedHabitEntity() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LongTermGoalEntity getGoal() {
        return goal;
    }

    public void setGoal(LongTermGoalEntity goal) {
        this.goal = goal;
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
