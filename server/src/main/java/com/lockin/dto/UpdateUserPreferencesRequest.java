package com.lockin.dto;

import jakarta.validation.constraints.Size;

public class UpdateUserPreferencesRequest {

    private String timezone;

    private String theme;

    private String currentPassword;

    @Size(min = 8, max = 128, message = "New password must be between 8 and 128 characters")
    private String newPassword;

    public UpdateUserPreferencesRequest() {}

    public UpdateUserPreferencesRequest(String timezone, String theme, String currentPassword, String newPassword) {
        this.timezone = timezone;
        this.theme = theme;
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
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

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
