package com.lockin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String baseUrl;
    // Cache for testing & development verification
    private final ConcurrentHashMap<String, String> latestVerificationTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> latestResetTokens = new ConcurrentHashMap<>();

    public EmailService(@Value("${app.frontend.url:http://localhost:5173}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public void sendVerificationEmail(String email, String rawToken) {
        latestVerificationTokens.put(email.toLowerCase(), rawToken);
        String verifyUrl = baseUrl + "/verify-email?token=" + rawToken;
        log.info("----------------------------------------------------------------");
        log.info("Sending Email Verification to: {}", email);
        log.info("Verification URL: {}", verifyUrl);
        log.info("Verification Token: {}", rawToken);
        log.info("----------------------------------------------------------------");
    }

    public void sendPasswordResetEmail(String email, String rawToken) {
        latestResetTokens.put(email.toLowerCase(), rawToken);
        String resetUrl = baseUrl + "/reset-password?token=" + rawToken;
        log.info("----------------------------------------------------------------");
        log.info("Sending Password Reset to: {}", email);
        log.info("Reset URL: {}", resetUrl);
        log.info("Reset Token: {}", rawToken);
        log.info("----------------------------------------------------------------");
    }

    public String getLatestVerificationToken(String email) {
        return latestVerificationTokens.get(email.toLowerCase());
    }

    public String getLatestResetToken(String email) {
        return latestResetTokens.get(email.toLowerCase());
    }
}
