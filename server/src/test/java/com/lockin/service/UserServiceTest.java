package com.lockin.service;

import com.lockin.dto.DeleteAccountRequest;
import com.lockin.dto.UpdateUserPreferencesRequest;
import com.lockin.dto.UserDataExportDto;
import com.lockin.dto.UserDto;
import com.lockin.entity.UserEntity;
import com.lockin.entity.UserPreferencesEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.UserPreferencesRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPreferencesRepository preferencesRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserEntity user;
    private UserPrincipal principal;
    private final String rawPassword = "StrongPassword123!";

    @BeforeEach
    void setUp() {
        preferencesRepository.deleteAll();
        userRepository.deleteAll();

        user = new UserEntity("settings_test@example.com", passwordEncoder.encode(rawPassword));
        user.setEmailVerified(true);
        user = userRepository.save(user);

        UserPreferencesEntity preferences = new UserPreferencesEntity(user, "UTC", "dark");
        preferencesRepository.save(preferences);

        principal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("Loads current user details and preferences")
    void shouldGetCurrentUser() {
        UserDto dto = userService.getCurrentUser(principal);
        assertNotNull(dto);
        assertEquals("settings_test@example.com", dto.getEmail());
        assertEquals("UTC", dto.getTimezone());
        assertEquals("dark", dto.getTheme());
    }

    @Test
    @DisplayName("Updates timezone and theme successfully")
    void shouldUpdatePreferences() {
        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setTimezone("America/New_York");
        request.setTheme("light");

        UserDto updated = userService.updateUser(principal, request);
        assertEquals("America/New_York", updated.getTimezone());
        assertEquals("light", updated.getTheme());
    }

    @Test
    @DisplayName("Rejects invalid IANA timezone identifier")
    void shouldRejectInvalidTimezone() {
        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setTimezone("Invalid/Timezone_123");

        AppException ex = assertThrows(AppException.class, () -> userService.updateUser(principal, request));
        assertTrue(ex.getMessage().contains("Invalid timezone"));
    }

    @Test
    @DisplayName("Changes password when current password matches")
    void shouldChangePassword() {
        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setCurrentPassword(rawPassword);
        request.setNewPassword("BrandNewSecurePassword456!");

        UserDto updated = userService.updateUser(principal, request);
        assertNotNull(updated);

        UserEntity refreshed = userRepository.findById(user.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("BrandNewSecurePassword456!", refreshed.getPasswordHash()));
    }

    @Test
    @DisplayName("Rejects password change when current password is wrong")
    void shouldRejectPasswordChangeWithWrongCurrentPassword() {
        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest();
        request.setCurrentPassword("WrongCurrentPassword!");
        request.setNewPassword("BrandNewSecurePassword456!");

        AppException ex = assertThrows(AppException.class, () -> userService.updateUser(principal, request));
        assertTrue(ex.getMessage().contains("does not match"));
    }

    @Test
    @DisplayName("Exports user profile and personal tracking data")
    void shouldExportUserData() {
        UserDataExportDto export = userService.exportUserData(principal);
        assertNotNull(export);
        assertNotNull(export.getExportedAt());
        assertEquals(user.getEmail(), export.getUser().getEmail());
        assertNotNull(export.getPeriods());
    }

    @Test
    @DisplayName("Permanently deletes account when password confirmation matches")
    void shouldDeleteAccount() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        DeleteAccountRequest request = new DeleteAccountRequest(rawPassword);

        userService.deleteAccount(principal, request, response);

        assertFalse(userRepository.findById(user.getId()).isPresent(), "User entity must be deleted");
        assertNotNull(response.getHeader("Set-Cookie"));
        assertTrue(response.getHeader("Set-Cookie").contains("Max-Age=0"));
    }

    @Test
    @DisplayName("Rejects account deletion with incorrect password")
    void shouldRejectAccountDeletionWithWrongPassword() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        DeleteAccountRequest request = new DeleteAccountRequest("IncorrectPassword!");

        AppException ex = assertThrows(AppException.class, () -> userService.deleteAccount(principal, request, response));
        assertTrue(ex.getMessage().contains("Incorrect password"));
        assertTrue(userRepository.findById(user.getId()).isPresent(), "User entity must still exist");
    }
}
