package com.lockin.service;

import com.lockin.dto.CreatePeriodRequest;
import com.lockin.dto.HabitDto;
import com.lockin.dto.PeriodResponse;
import com.lockin.dto.UpdatePeriodRequest;
import com.lockin.entity.HabitEntity;
import com.lockin.entity.PeriodStatus;
import com.lockin.entity.TrackingPeriodEntity;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PeriodService {

    private final TrackingPeriodRepository periodRepository;
    private final UserRepository userRepository;

    public PeriodService(TrackingPeriodRepository periodRepository, UserRepository userRepository) {
        this.periodRepository = periodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PeriodResponse createPeriod(UserPrincipal principal, CreatePeriodRequest request) {
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.resolveEndDate();

        if (startDate.isAfter(endDate)) {
            throw new AppException("Start date must be before or equal to end date");
        }

        UUID userId = principal.getId();
        if (periodRepository.existsByUserIdAndStatus(userId, PeriodStatus.ACTIVE)) {
            throw new AppException("An active tracking period already exists. Complete or archive it before starting a new one.", HttpStatus.CONFLICT);
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        TrackingPeriodEntity period = new TrackingPeriodEntity(
                user,
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                startDate,
                endDate
        );

        if (request.getHabitNames() != null && !request.getHabitNames().isEmpty()) {
            List<HabitEntity> habits = new ArrayList<>();
            int order = 0;
            for (String rawName : request.getHabitNames()) {
                if (rawName != null && !rawName.trim().isEmpty()) {
                    HabitEntity habit = new HabitEntity(user, period, rawName.trim(), startDate, order++);
                    habits.add(habit);
                }
            }
            period.setHabits(habits);
        }

        TrackingPeriodEntity saved = periodRepository.save(period);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PeriodResponse getActivePeriod(UserPrincipal principal) {
        return periodRepository.findByUserIdAndStatus(principal.getId(), PeriodStatus.ACTIVE)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public PeriodResponse getPeriodById(UserPrincipal principal, UUID periodId) {
        return periodRepository.findByIdAndUserId(periodId, principal.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<PeriodResponse> getUserPeriods(UserPrincipal principal) {
        return periodRepository.findByUserIdOrderByStartDateDesc(principal.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PeriodResponse updatePeriod(UserPrincipal principal, UUID periodId, UpdatePeriodRequest request) {
        TrackingPeriodEntity period = periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        if (period.getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Completed tracking periods are read-only and cannot be modified", HttpStatus.BAD_REQUEST);
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            period.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            period.setDescription(request.getDescription().trim());
        }

        TrackingPeriodEntity updated = periodRepository.save(period);
        return toResponse(updated);
    }

    @Transactional
    public PeriodResponse completePeriod(UserPrincipal principal, UUID periodId) {
        TrackingPeriodEntity period = periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        period.setStatus(PeriodStatus.COMPLETED);
        TrackingPeriodEntity updated = periodRepository.save(period);
        return toResponse(updated);
    }

    private PeriodResponse toResponse(TrackingPeriodEntity entity) {
        LocalDate today = LocalDate.now();
        long totalDays = ChronoUnit.DAYS.between(entity.getStartDate(), entity.getEndDate()) + 1;

        long daysElapsed = 0;
        if (!today.isBefore(entity.getStartDate())) {
            daysElapsed = Math.min(totalDays, ChronoUnit.DAYS.between(entity.getStartDate(), today) + 1);
        }

        long daysRemaining = 0;
        if (!today.isAfter(entity.getEndDate())) {
            daysRemaining = ChronoUnit.DAYS.between(today, entity.getEndDate()) + 1;
        }

        List<HabitDto> habitDtos = entity.getHabits() != null
                ? entity.getHabits().stream()
                .map(h -> new HabitDto(
                        h.getId(),
                        h.getName(),
                        h.getDescription(),
                        h.getCategory(),
                        h.getDisplayOrder(),
                        h.getEffectiveStartDate(),
                        h.isArchived()
                ))
                .toList()
                : List.of();

        return new PeriodResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                totalDays,
                daysElapsed,
                daysRemaining,
                habitDtos,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
