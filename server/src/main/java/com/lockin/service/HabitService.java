package com.lockin.service;

import com.lockin.dto.CreateHabitRequest;
import com.lockin.dto.HabitDto;
import com.lockin.dto.ReorderHabitsRequest;
import com.lockin.dto.UpdateHabitRequest;
import com.lockin.entity.HabitEntity;
import com.lockin.entity.PeriodStatus;
import com.lockin.entity.TrackingPeriodEntity;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.HabitRepository;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final TrackingPeriodRepository periodRepository;
    private final UserRepository userRepository;

    public HabitService(
            HabitRepository habitRepository,
            TrackingPeriodRepository periodRepository,
            UserRepository userRepository
    ) {
        this.habitRepository = habitRepository;
        this.periodRepository = periodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public HabitDto createHabit(UserPrincipal principal, UUID periodId, CreateHabitRequest request) {
        TrackingPeriodEntity period = periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        if (period.getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Cannot add habits to a completed tracking period", HttpStatus.BAD_REQUEST);
        }

        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        LocalDate effectiveStart = request.getEffectiveStartDate();
        if (effectiveStart == null) {
            LocalDate today = LocalDate.now();
            effectiveStart = today.isBefore(period.getStartDate()) ? period.getStartDate() : today;
        }

        List<HabitEntity> existing = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        HabitEntity habit = new HabitEntity(
                user,
                period,
                request.getName().trim(),
                effectiveStart,
                nextOrder
        );
        habit.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        habit.setCategory(request.getCategory() != null ? request.getCategory().trim() : null);
        habit.setTwoMinuteVersion(request.getTwoMinuteVersion() != null && !request.getTwoMinuteVersion().isBlank() ? request.getTwoMinuteVersion().trim() : null);
        habit.setHabitStackCue(request.getHabitStackCue() != null && !request.getHabitStackCue().isBlank() ? request.getHabitStackCue().trim() : null);

        HabitEntity saved = habitRepository.save(habit);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<HabitDto> getHabitsForPeriod(UserPrincipal principal, UUID periodId) {
        periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        return habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public HabitDto updateHabit(UserPrincipal principal, UUID habitId, UpdateHabitRequest request) {
        HabitEntity habit = habitRepository.findByIdAndUserId(habitId, principal.getId())
                .orElseThrow(() -> new AppException("Habit not found", HttpStatus.NOT_FOUND));

        if (habit.getPeriod().getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Cannot modify habits of a completed tracking period", HttpStatus.BAD_REQUEST);
        }

        habit.setName(request.getName().trim());
        if (request.getDescription() != null) {
            habit.setDescription(request.getDescription().trim());
        }
        if (request.getCategory() != null) {
            habit.setCategory(request.getCategory().trim());
        }
        if (request.getDisplayOrder() != null) {
            habit.setDisplayOrder(request.getDisplayOrder());
        }

        HabitEntity updated = habitRepository.save(habit);
        return toDto(updated);
    }

    @Transactional
    public HabitDto archiveHabit(UserPrincipal principal, UUID habitId) {
        HabitEntity habit = habitRepository.findByIdAndUserId(habitId, principal.getId())
                .orElseThrow(() -> new AppException("Habit not found", HttpStatus.NOT_FOUND));

        if (habit.getPeriod().getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Cannot archive habits in a completed tracking period", HttpStatus.BAD_REQUEST);
        }

        habit.setArchivedAt(Instant.now());
        HabitEntity updated = habitRepository.save(habit);
        return toDto(updated);
    }

    @Transactional
    public List<HabitDto> reorderHabits(UserPrincipal principal, UUID periodId, ReorderHabitsRequest request) {
        periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());
        Map<UUID, HabitEntity> habitMap = habits.stream()
                .collect(Collectors.toMap(HabitEntity::getId, Function.identity()));

        int order = 0;
        for (UUID id : request.getHabitIds()) {
            HabitEntity habit = habitMap.get(id);
            if (habit != null) {
                habit.setDisplayOrder(order++);
                habitRepository.save(habit);
            }
        }

        return habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    private HabitDto toDto(HabitEntity entity) {
        return new HabitDto(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getDisplayOrder(),
                entity.getEffectiveStartDate(),
                entity.isArchived(),
                entity.getGoal() != null ? entity.getGoal().getId() : null,
                entity.getGoal() != null ? entity.getGoal().getTitle() : null,
                entity.getTwoMinuteVersion(),
                entity.getHabitStackCue()
        );
    }
}
