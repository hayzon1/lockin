package com.lockin.controller;

import com.lockin.dto.AdminStatsDto;
import com.lockin.dto.AdminUserItemDto;
import com.lockin.dto.ApiResponse;
import com.lockin.security.UserPrincipal;
import com.lockin.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AdminStatsDto stats = adminService.getAdminStats(principal);
        return ResponseEntity.ok(ApiResponse.success(stats, "Platform administrative metrics"));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserItemDto>>> getAdminUsers(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<AdminUserItemDto> users = adminService.getAdminUsers(principal);
        return ResponseEntity.ok(ApiResponse.success(users, "Registered users list"));
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body
    ) {
        String role = body.get("role");
        adminService.updateUserRole(principal, userId, role);
        return ResponseEntity.ok(ApiResponse.success(null, "User role updated successfully"));
    }
}
