package com.lockin.dto;

import jakarta.validation.constraints.NotBlank;

public class DeleteAccountRequest {

    @NotBlank(message = "Password confirmation is required to delete your account")
    private String password;

    public DeleteAccountRequest() {}

    public DeleteAccountRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
