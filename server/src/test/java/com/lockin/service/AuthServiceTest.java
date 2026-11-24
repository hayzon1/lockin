package com.lockin.service;

import com.lockin.dto.LoginRequest;
import com.lockin.dto.RegisterRequest;
import com.lockin.dto.UserDto;
import com.lockin.dto.VerifyEmailRequest;
import com.lockin.exception.AppException;
import com.lockin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private final String testEmail = "testuser@example.com";
    private final String testPassword = "SecurePassword123!";

    @BeforeEach
    void cleanUp() {
        userRepository.findByEmailIgnoreCase(testEmail).ifPresent(userRepository::delete);
    }

    @Test
    @DisplayName("Registration successfully creates account and generates verification token")
    void shouldRegisterNewUser() {
        RegisterRequest request = new RegisterRequest(testEmail, testPassword, testPassword);
        UserDto registered = authService.register(request);

        assertNotNull(registered.getId());
        assertEquals(testEmail, registered.getEmail());
        assertFalse(registered.isEmailVerified());

        String token = emailService.getLatestVerificationToken(testEmail);
        assertNotNull(token);
    }

    @Test
    @DisplayName("Unverified account cannot log in")
    void shouldBlockLoginForUnverifiedUser() {
        RegisterRequest registerReq = new RegisterRequest(testEmail, testPassword, testPassword);
        authService.register(registerReq);

        LoginRequest loginReq = new LoginRequest(testEmail, testPassword);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AppException ex = assertThrows(AppException.class, () -> authService.login(loginReq, response));
        assertTrue(ex.getMessage().contains("verify your email"));
    }

    @Test
    @DisplayName("Email verification activates account and enables login")
    void shouldVerifyEmailAndAllowLogin() {
        RegisterRequest registerReq = new RegisterRequest(testEmail, testPassword, testPassword);
        authService.register(registerReq);

        String token = emailService.getLatestVerificationToken(testEmail);
        assertNotNull(token);

        authService.verifyEmail(new VerifyEmailRequest(token));

        LoginRequest loginReq = new LoginRequest(testEmail, testPassword);
        MockHttpServletResponse response = new MockHttpServletResponse();
        UserDto loggedIn = authService.login(loginReq, response);

        assertNotNull(loggedIn);
        assertTrue(loggedIn.isEmailVerified());
        assertNotNull(response.getHeader("Set-Cookie"));
        assertTrue(response.getHeader("Set-Cookie").contains("lockin_session"));
    }
}
