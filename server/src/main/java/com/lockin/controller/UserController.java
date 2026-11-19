package com.lockin.controller;

import com.lockin.dto.*;
import com.lockin.security.UserPrincipal;
import com.lockin.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserDto user = userService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserPreferencesRequest request
    ) {
        UserDto user = userService.updateUser(principal, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User profile and preferences updated successfully"));
    }

    @GetMapping("/export")
    public ResponseEntity<ApiResponse<UserDataExportDto>> exportUserData(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserDataExportDto export = userService.exportUserData(principal);
        return ResponseEntity.ok(ApiResponse.success(export, "Data export completed"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DeleteAccountRequest request,
            HttpServletResponse response
    ) {
        userService.deleteAccount(principal, request, response);
        return ResponseEntity.ok(ApiResponse.success(null, "Account permanently deleted"));
    }
}
