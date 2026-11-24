package com.lockin.service;

import com.lockin.dto.DeleteAccountRequest;
import com.lockin.dto.UpdateUserPreferencesRequest;
import com.lockin.dto.UserDataExportDto;
import com.lockin.dto.UserDto;
import com.lockin.entity.*;
import com.lockin.exception.AppException;
import com.lockin.repository.*;
import com.lockin.security.CookieService;
import com.lockin.security.UserPrincipal;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final TrackingPeriodRepository periodRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CookieService cookieService;

    public UserService(
            UserRepository userRepository,
            UserPreferencesRepository preferencesRepository,
            TrackingPeriodRepository periodRepository,
            HabitRepository habitRepository,
            HabitCompletionRepository completionRepository,
            PasswordEncoder passwordEncoder,
            CookieService cookieService
    ) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.periodRepository = periodRepository;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.passwordEncoder = passwordEncoder;
        this.cookieService = cookieService;
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        UserPreferencesEntity preferences = preferencesRepository.findByUserId(user.getId()).orElse(null);
        return toDto(user, preferences);
    }

    @Transactional
    public UserDto updateUser(UserPrincipal principal, UpdateUserPreferencesRequest request) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        UserPreferencesEntity preferences = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserPreferencesEntity(user, "UTC", "dark"));

        if (request.getTimezone() != null && !request.getTimezone().trim().isEmpty()) {
            try {
                ZoneId.of(request.getTimezone().trim());
                preferences.setTimezone(request.getTimezone().trim());
            } catch (Exception e) {
                throw new AppException("Invalid timezone identifier. Must be a valid IANA timezone.", HttpStatus.BAD_REQUEST);
            }
        }

        if (request.getTheme() != null && !request.getTheme().trim().isEmpty()) {
            String theme = request.getTheme().trim().toLowerCase();
            if (!Set.of("dark", "light", "system").contains(theme)) {
                throw new AppException("Theme must be 'dark', 'light', or 'system'", HttpStatus.BAD_REQUEST);
            }
            preferences.setTheme(theme);
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim().isEmpty() ? null : request.getFullName().trim());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender().trim().isEmpty() ? null : request.getGender().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                throw new AppException("Current password is required to set a new password", HttpStatus.BAD_REQUEST);
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new AppException("Current password does not match", HttpStatus.BAD_REQUEST);
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
            userRepository.save(user);
        }

        preferencesRepository.save(preferences);
        return toDto(user, preferences);
    }

    @Transactional(readOnly = true)
    public UserDataExportDto exportUserData(UserPrincipal principal) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        UserPreferencesEntity preferences = preferencesRepository.findByUserId(user.getId()).orElse(null);
        UserDto userDto = toDto(user, preferences);

        List<TrackingPeriodEntity> periods = periodRepository.findByUserIdOrderByStartDateDesc(user.getId());
        List<UserDataExportDto.PeriodExportDto> periodExports = new ArrayList<>();

        for (TrackingPeriodEntity period : periods) {
            List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(period.getId(), user.getId());
            List<UserDataExportDto.HabitExportDto> habitExports = new ArrayList<>();

            for (HabitEntity habit : habits) {
                List<LocalDate> completions = completionRepository.findByHabitIdOrderByCompletionDateAsc(habit.getId())
                        .stream()
                        .map(HabitCompletionEntity::getCompletionDate)
                        .toList();

                habitExports.add(new UserDataExportDto.HabitExportDto(
                        habit.getId(),
                        habit.getName(),
                        habit.getDescription(),
                        habit.getCategory(),
                        habit.getDisplayOrder(),
                        habit.getEffectiveStartDate(),
                        habit.isArchived(),
                        completions
                ));
            }

            periodExports.add(new UserDataExportDto.PeriodExportDto(
                    period.getId(),
                    period.getName(),
                    period.getDescription(),
                    period.getStartDate(),
                    period.getEndDate(),
                    period.getStatus().name(),
                    habitExports
            ));
        }

        return new UserDataExportDto(Instant.now(), userDto, periodExports);
    }

    @Transactional
    public void deleteAccount(UserPrincipal principal, DeleteAccountRequest request, HttpServletResponse response) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Incorrect password. Account deletion aborted.", HttpStatus.FORBIDDEN);
        }

        userRepository.delete(user);

        ResponseCookie cleanCookie = cookieService.createCleanSessionCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());
    }

    private UserDto toDto(UserEntity user, UserPreferencesEntity preferences) {
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
}
