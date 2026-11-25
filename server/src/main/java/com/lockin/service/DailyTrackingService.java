package com.lockin.service;

import com.lockin.dto.DailyChecklistItemDto;
import com.lockin.dto.DailyChecklistResponse;
import com.lockin.entity.*;
import com.lockin.exception.AppException;
import com.lockin.repository.HabitCompletionRepository;
import com.lockin.repository.HabitRepository;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyTrackingService {

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final TrackingPeriodRepository periodRepository;
    private final UserRepository userRepository;

    public DailyTrackingService(
            HabitRepository habitRepository,
            HabitCompletionRepository completionRepository,
            TrackingPeriodRepository periodRepository,
            UserRepository userRepository
    ) {
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.periodRepository = periodRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DailyChecklistResponse getDailyChecklist(UserPrincipal principal, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        UUID userId = principal.getId();

        // Find active period first, then fallback to any period covering the date
        TrackingPeriodEntity period = periodRepository.findByUserIdAndStatus(userId, PeriodStatus.ACTIVE)
                .filter(p -> !targetDate.isBefore(p.getStartDate()) && !targetDate.isAfter(p.getEndDate()))
                .orElseGet(() -> periodRepository.findByUserIdOrderByStartDateDesc(userId).stream()
                        .filter(p -> !targetDate.isBefore(p.getStartDate()) && !targetDate.isAfter(p.getEndDate()))
                        .findFirst()
                        .orElse(null)
                );

        if (period == null) {
            return new DailyChecklistResponse(
                    targetDate,
                    targetDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                    null,
                    null,
                    List.of(),
                    0,
                    0,
                    null
            );
        }

        List<HabitEntity> allHabits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(period.getId(), userId);

        // Filter habits eligible on targetDate
        List<HabitEntity> eligibleHabits = allHabits.stream()
                .filter(h -> isHabitEligibleOnDate(h, targetDate))
                .toList();

        Set<UUID> eligibleHabitIds = eligibleHabits.stream()
                .map(HabitEntity::getId)
                .collect(Collectors.toSet());

        List<HabitCompletionEntity> completions = eligibleHabitIds.isEmpty()
                ? List.of()
                : completionRepository.findByHabitIdInAndCompletionDate(eligibleHabitIds, targetDate);

        Map<UUID, Instant> completionMap = completions.stream()
                .collect(Collectors.toMap(c -> c.getHabit().getId(), HabitCompletionEntity::getCompletedAt));

        List<DailyChecklistItemDto> items = eligibleHabits.stream()
                .map(h -> new DailyChecklistItemDto(
                        h.getId(),
                        h.getName(),
                        h.getDescription(),
                        h.getCategory(),
                        h.getDisplayOrder(),
                        completionMap.containsKey(h.getId()),
                        completionMap.get(h.getId()),
                        h.getGoal() != null ? h.getGoal().getId() : null,
                        h.getGoal() != null ? h.getGoal().getTitle() : null,
                        h.getTwoMinuteVersion(),
                        h.getHabitStackCue()
                ))
                .toList();

        int eligibleCount = eligibleHabits.size();
        int completedCount = completions.size();
        Double percentage = eligibleCount == 0 ? null : Math.round(((double) completedCount / eligibleCount) * 1000.0) / 10.0;

        return new DailyChecklistResponse(
                targetDate,
                targetDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                period.getId(),
                period.getName(),
                items,
                eligibleCount,
                completedCount,
                percentage
        );
    }

    @Transactional
    public DailyChecklistResponse checkHabit(UserPrincipal principal, UUID habitId, LocalDate date) {
        HabitEntity habit = habitRepository.findByIdAndUserId(habitId, principal.getId())
                .orElseThrow(() -> new AppException("Habit not found", HttpStatus.NOT_FOUND));

        TrackingPeriodEntity period = habit.getPeriod();
        if (period.getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Cannot check habits for a completed tracking period", HttpStatus.BAD_REQUEST);
        }

        if (date.isBefore(period.getStartDate()) || date.isAfter(period.getEndDate())) {
            throw new AppException("Date is outside the tracking period bounds", HttpStatus.BAD_REQUEST);
        }

        if (!isHabitEligibleOnDate(habit, date)) {
            throw new AppException("Habit was not active on this date", HttpStatus.BAD_REQUEST);
        }

        // Idempotent save
        if (!completionRepository.existsByHabitIdAndCompletionDate(habitId, date)) {
            UserEntity user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
            HabitCompletionEntity completion = new HabitCompletionEntity(user, habit, date);
            completionRepository.save(completion);
        }

        return getDailyChecklist(principal, date);
    }

    @Transactional
    public DailyChecklistResponse uncheckHabit(UserPrincipal principal, UUID habitId, LocalDate date) {
        HabitEntity habit = habitRepository.findByIdAndUserId(habitId, principal.getId())
                .orElseThrow(() -> new AppException("Habit not found", HttpStatus.NOT_FOUND));

        TrackingPeriodEntity period = habit.getPeriod();
        if (period.getStatus() == PeriodStatus.COMPLETED) {
            throw new AppException("Cannot uncheck habits for a completed tracking period", HttpStatus.BAD_REQUEST);
        }

        completionRepository.deleteByHabitIdAndCompletionDate(habitId, date);

        return getDailyChecklist(principal, date);
    }

    public boolean isHabitEligibleOnDate(HabitEntity habit, LocalDate date) {
        if (date.isBefore(habit.getEffectiveStartDate())) {
            return false;
        }
        if (habit.getArchivedAt() != null) {
            LocalDate archiveDate = LocalDate.ofInstant(habit.getArchivedAt(), ZoneId.of("UTC"));
            return !date.isAfter(archiveDate);
        }
        return true;
    }
}
