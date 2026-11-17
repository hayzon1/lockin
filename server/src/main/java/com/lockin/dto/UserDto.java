package com.lockin.dto;

import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private boolean emailVerified;
    private String timezone;
    private String theme;

    public UserDto() {}

    public UserDto(UUID id, String email, boolean emailVerified, String timezone, String theme) {
        this.id = id;
        this.email = email;
        this.emailVerified = emailVerified;
        this.timezone = timezone;
        this.theme = theme;
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
