package com.lockin.dto;

public class SessionResponse {
    private boolean authenticated;
    private UserDto user;

    public SessionResponse() {}

    public SessionResponse(boolean authenticated, UserDto user) {
        this.authenticated = authenticated;
        this.user = user;
    }

    public static SessionResponse unauthenticated() {
        return new SessionResponse(false, null);
    }

    public static SessionResponse authenticated(UserDto user) {
        return new SessionResponse(true, user);
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }
}
