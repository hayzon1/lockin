package com.lockin.service;

import com.lockin.dto.AdminStatsDto;
import com.lockin.dto.AdminUserItemDto;
import com.lockin.dto.RegisterRequest;
import com.lockin.exception.AppException;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AdminServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    private UserPrincipal adminPrincipal;
    private UserPrincipal normalUserPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new UserPrincipal(UUID.randomUUID(), "admin@lockin.app", "pass", true, "ADMIN");
        normalUserPrincipal = new UserPrincipal(UUID.randomUUID(), "user@lockin.app", "pass", true, "USER");
    }

    @Test
    @DisplayName("Non-admin user cannot access admin metrics")
    void shouldDenyNonAdminAccess() {
        AppException ex = assertThrows(AppException.class, () -> adminService.getAdminStats(normalUserPrincipal));
        assertTrue(ex.getMessage().contains("Administrator privileges required"));
    }

    @Test
    @DisplayName("Admin can retrieve platform stats including demographics")
    void shouldReturnAdminStatsForAdmin() {
        // Register sample user with demographics
        RegisterRequest request = new RegisterRequest(
                "demouser@example.com",
                "Password123!",
                "Password123!",
                "Demo Person",
                28,
                "FEMALE"
        );
        authService.register(request);

        AdminStatsDto stats = adminService.getAdminStats(adminPrincipal);
        assertNotNull(stats);
        assertTrue(stats.getTotalUsers() > 0);
        assertNotNull(stats.getGenderDistribution());
    }

    @Test
    @DisplayName("Admin can retrieve user list with demographics")
    void shouldReturnAdminUsersList() {
        RegisterRequest request = new RegisterRequest(
                "demouser2@example.com",
                "Password123!",
                "Password123!",
                "Jane Doe",
                32,
                "FEMALE"
        );
        authService.register(request);

        List<AdminUserItemDto> users = adminService.getAdminUsers(adminPrincipal);
        assertNotNull(users);
        assertFalse(users.isEmpty());

        AdminUserItemDto found = users.stream()
                .filter(u -> "demouser2@example.com".equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertEquals("Jane Doe", found.getFullName());
        assertEquals(32, found.getAge());
        assertEquals("FEMALE", found.getGender());
    }
}
