package com.lockin.dto;

import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private boolean emailVerified;
    private String timezone;
    private String theme;
    private String fullName;
    private Integer age;
    private String gender;
    private String role;

    public UserDto() {}

    public UserDto(UUID id, String email, boolean emailVerified, String timezone, String theme) {
        this(id, email, emailVerified, timezone, theme, null, null, null, "USER");
    }

    public UserDto(UUID id, String email, boolean emailVerified, String timezone, String theme,
                   String fullName, Integer age, String gender, String role) {
        this.id = id;
        this.email = email;
        this.emailVerified = emailVerified;
        this.timezone = timezone;
        this.theme = theme;
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.role = role != null ? role : "USER";
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

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }
}
