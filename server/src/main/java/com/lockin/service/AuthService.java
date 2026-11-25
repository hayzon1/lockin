package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.EmailVerificationTokenEntity;
import com.lockin.entity.PasswordResetTokenEntity;
import com.lockin.entity.UserEntity;
import com.lockin.entity.UserPreferencesEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.EmailVerificationTokenRepository;
import com.lockin.repository.PasswordResetTokenRepository;
import com.lockin.repository.UserPreferencesRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.CookieService;
import com.lockin.security.JwtService;
import com.lockin.security.UserPrincipal;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CookieService cookieService;
    private final EmailService emailService;
    private final long sessionMaxAgeSeconds;
    private final boolean autoVerify;
    private final java.util.Set<String> adminEmails;

    public AuthService(
            UserRepository userRepository,
            UserPreferencesRepository preferencesRepository,
            EmailVerificationTokenRepository verificationTokenRepository,
            PasswordResetTokenRepository resetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CookieService cookieService,
            EmailService emailService,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
            @Value("${app.auth.auto-verify:true}") boolean autoVerify,
            @Value("${app.auth.admin-emails:azon1129@gmail.com,admin@lockin.app}") String adminEmailsConfig
    ) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.cookieService = cookieService;
        this.emailService = emailService;
        this.sessionMaxAgeSeconds = expirationMs / 1000;
        this.autoVerify = autoVerify;
        this.adminEmails = java.util.Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        return register(request, null);
    }

    @Transactional
    public UserDto register(RegisterRequest request, HttpServletResponse response) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException("Passwords do not match");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AppException("An account with this email address already exists", HttpStatus.CONFLICT);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        UserEntity user = new UserEntity(normalizedEmail, encodedPassword);

        // Demographic attributes
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            user.setGender(request.getGender().trim());
        }

        // Check if admin email
        if (adminEmails.contains(normalizedEmail)) {
            user.setRole("ADMIN");
            user.setEmailVerified(true);
        } else if (autoVerify) {
            user.setEmailVerified(true);
        }

        user = userRepository.save(user);

        UserPreferencesEntity preferences = new UserPreferencesEntity(user, "UTC", "dark");
        preferencesRepository.save(preferences);

        // Generate email verification token (for audit / reset workflows)
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);

        EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(user, tokenHash, expiresAt);
        verificationTokenRepository.save(tokenEntity);

        emailService.sendVerificationEmail(user.getEmail(), rawToken);

        // If auto-verify is active and response is provided, automatically issue session cookie
        if (user.isEmailVerified() && response != null) {
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.isEmailVerified());
            ResponseCookie sessionCookie = cookieService.createSessionCookie(token, sessionMaxAgeSeconds);
            response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie.toString());
        }

        return toUserDto(user, preferences);
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        String tokenHash = hashToken(request.getToken().trim());
        EmailVerificationTokenEntity tokenEntity = verificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid or expired verification token", HttpStatus.BAD_REQUEST));

        if (tokenEntity.isUsed()) {
            throw new AppException("Verification token has already been used", HttpStatus.BAD_REQUEST);
        }

        if (tokenEntity.isExpired()) {
            throw new AppException("Verification token has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        tokenEntity.setUsedAt(Instant.now());
        verificationTokenRepository.save(tokenEntity);

        UserEntity user = tokenEntity.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
            if (user.isEmailVerified()) {
                throw new AppException("Email is already verified", HttpStatus.BAD_REQUEST);
            }

            verificationTokenRepository.deleteByUserId(user.getId());

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = hashToken(rawToken);
            Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);

            EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(user, tokenHash, expiresAt);
            verificationTokenRepository.save(tokenEntity);

            emailService.sendVerificationEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public UserDto login(LoginRequest request, HttpServletResponse response) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        if (!user.isEmailVerified()) {
            if (autoVerify || adminEmails.contains(normalizedEmail)) {
                user.setEmailVerified(true);
                userRepository.save(user);
            } else {
                throw new AppException("Account unverified. Please verify your email before logging in.", HttpStatus.FORBIDDEN);
            }
        }

        if (adminEmails.contains(normalizedEmail) && !"ADMIN".equalsIgnoreCase(user.getRole())) {
            user.setRole("ADMIN");
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.isEmailVerified());
        ResponseCookie sessionCookie = cookieService.createSessionCookie(token, sessionMaxAgeSeconds);
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie.toString());

        UserPreferencesEntity preferences = preferencesRepository.findByUserId(user.getId()).orElse(null);
        return toUserDto(user, preferences);
    }

    public void logout(HttpServletResponse response) {
        ResponseCookie cleanCookie = cookieService.createCleanSessionCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
            resetTokenRepository.deleteByUserId(user.getId());

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = hashToken(rawToken);
            Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);

            PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity(user, tokenHash, expiresAt);
            resetTokenRepository.save(tokenEntity);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new AppException("Passwords do not match");
        }

        String tokenHash = hashToken(request.getToken().trim());
        PasswordResetTokenEntity tokenEntity = resetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid or expired reset token", HttpStatus.BAD_REQUEST));

        if (tokenEntity.isUsed()) {
            throw new AppException("Password reset token has already been used", HttpStatus.BAD_REQUEST);
        }

        if (tokenEntity.isExpired()) {
            throw new AppException("Password reset token has expired", HttpStatus.BAD_REQUEST);
        }

        tokenEntity.setUsedAt(Instant.now());
        resetTokenRepository.save(tokenEntity);

        UserEntity user = tokenEntity.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(UserPrincipal principal) {
        if (principal == null) {
            return SessionResponse.unauthenticated();
        }

        return userRepository.findById(principal.getId())
                .map(user -> {
                    UserPreferencesEntity preferences = preferencesRepository.findByUserId(user.getId()).orElse(null);
                    return SessionResponse.authenticated(toUserDto(user, preferences));
                })
                .orElse(SessionResponse.unauthenticated());
    }

    private UserDto toUserDto(UserEntity user, UserPreferencesEntity preferences) {
        String timezone = preferences != null ? preferences.getTimezone() : "UTC";
        String theme = preferences != null ? preferences.getTheme() : "dark";
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.isEmailVerified(),
                timezone,
                theme,
                user.getFullName(),
                user.getAge(),
                user.getGender(),
                user.getRole()
        );
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
