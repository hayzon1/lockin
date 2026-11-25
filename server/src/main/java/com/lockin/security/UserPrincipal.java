package com.lockin.security;

import com.lockin.entity.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final boolean emailVerified;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, String password, boolean emailVerified, String role) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.emailVerified = emailVerified;
        this.role = role != null ? role.toUpperCase() : "USER";

        java.util.List<GrantedAuthority> auths = new java.util.ArrayList<>();
        auths.add(new SimpleGrantedAuthority("ROLE_USER"));
        if ("ADMIN".equalsIgnoreCase(role)) {
            auths.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        this.authorities = java.util.Collections.unmodifiableList(auths);
    }

    public static UserPrincipal create(UserEntity user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isEmailVerified(),
                user.getRole()
        );
    }

    public String getRole() {
        return role;
    }

    public UUID getId() {
        return id;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
