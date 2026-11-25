package com.lockin.dto;

import java.time.Instant;
import java.util.UUID;

public class AdminUserItemDto {
    private UUID id;
    private String email;
    private String fullName;
    private Integer age;
    private String gender;
    private String role;
    private boolean emailVerified;
    private Instant createdAt;
    private String activePeriodName;
    private Integer activePeriodDays;
    private int totalHabitsCount;
    private int totalCompletionsCount;
    private int currentStreak;

    public AdminUserItemDto() {}

    public AdminUserItemDto(UUID id, String email, String fullName, Integer age, String gender,
                            String role, boolean emailVerified, Instant createdAt,
                            String activePeriodName, Integer activePeriodDays,
                            int totalHabitsCount, int totalCompletionsCount, int currentStreak) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.role = role;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
        this.activePeriodName = activePeriodName;
        this.activePeriodDays = activePeriodDays;
        this.totalHabitsCount = totalHabitsCount;
        this.totalCompletionsCount = totalCompletionsCount;
        this.currentStreak = currentStreak;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getActivePeriodName() {
        return activePeriodName;
    }

    public void setActivePeriodName(String activePeriodName) {
        this.activePeriodName = activePeriodName;
    }

    public Integer getActivePeriodDays() {
        return activePeriodDays;
    }

    public void setActivePeriodDays(Integer activePeriodDays) {
        this.activePeriodDays = activePeriodDays;
    }

    public int getTotalHabitsCount() {
        return totalHabitsCount;
    }

    public void setTotalHabitsCount(int totalHabitsCount) {
        this.totalHabitsCount = totalHabitsCount;
    }

    public int getTotalCompletionsCount() {
        return totalCompletionsCount;
    }

    public void setTotalCompletionsCount(int totalCompletionsCount) {
        this.totalCompletionsCount = totalCompletionsCount;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }
}
