package com.lockin.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "habit_completions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_habit_completion_day", columnNames = {"habit_id", "completion_date"})
        }
)
public class HabitCompletionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private HabitEntity habit;

    @Column(name = "completion_date", nullable = false)
    private LocalDate completionDate;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    public HabitCompletionEntity() {}

    public HabitCompletionEntity(UserEntity user, HabitEntity habit, LocalDate completionDate) {
        this.user = user;
        this.habit = habit;
        this.completionDate = completionDate;
        this.completedAt = Instant.now();
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

    public HabitEntity getHabit() {
        return habit;
    }

    public void setHabit(HabitEntity habit) {
        this.habit = habit;
    }

    public LocalDate getCompletionDate() {
        return completionDate;
    }

    public void setCompletionDate(LocalDate completionDate) {
        this.completionDate = completionDate;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
