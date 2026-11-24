package com.lockin.service;

import com.lockin.dto.CalendarDayDto;
import com.lockin.dto.CalendarMonthResponse;
import com.lockin.dto.DailyChecklistResponse;
import com.lockin.entity.HabitEntity;
import com.lockin.entity.TrackingPeriodEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.HabitCompletionRepository;
import com.lockin.repository.HabitRepository;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CalendarService {

    private final TrackingPeriodRepository periodRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final DailyTrackingService dailyTrackingService;

    public CalendarService(
            TrackingPeriodRepository periodRepository,
            HabitRepository habitRepository,
            HabitCompletionRepository completionRepository,
            DailyTrackingService dailyTrackingService
    ) {
        this.periodRepository = periodRepository;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.dailyTrackingService = dailyTrackingService;
    }

    @Transactional(readOnly = true)
    public CalendarMonthResponse getMonthView(UserPrincipal principal, UUID periodId, int year, int month) {
        if (month < 1 || month > 12) {
            throw new AppException("Invalid month: must be between 1 and 12", HttpStatus.BAD_REQUEST);
        }

        TrackingPeriodEntity period = periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());
        YearMonth ym = YearMonth.of(year, month);
        LocalDate today = LocalDate.now();

        List<CalendarDayDto> days = new ArrayList<>();
        int daysInMonth = ym.lengthOfMonth();

        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = ym.atDay(day);
            boolean inPeriod = !date.isBefore(period.getStartDate()) && !date.isAfter(period.getEndDate());
            boolean isFuture = date.isAfter(today);
            boolean isToday = date.isEqual(today);

            if (!inPeriod) {
                days.add(new CalendarDayDto(date, day, false, 0, 0, null, 0, isFuture, isToday));
            } else if (isFuture) {
                long scheduledCount = habits.stream()
                        .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, date))
                        .count();
                days.add(new CalendarDayDto(date, day, true, (int) scheduledCount, 0, null, 0, true, isToday));
            } else {
                List<HabitEntity> eligible = habits.stream()
                        .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, date))
                        .toList();

                Set<UUID> ids = eligible.stream().map(HabitEntity::getId).collect(Collectors.toSet());
                int completed = ids.isEmpty() ? 0 :
                        completionRepository.findByHabitIdInAndCompletionDate(ids, date).size();

                int eligibleCount = eligible.size();
                Double percentage = eligibleCount == 0 ? null :
                        Math.round(((double) completed / eligibleCount) * 1000.0) / 10.0;

                int intensity = 0;
                if (percentage != null && percentage > 0.0) {
                    if (percentage <= 25.0) {
                        intensity = 1;
                    } else if (percentage <= 50.0) {
                        intensity = 2;
                    } else if (percentage <= 75.0) {
                        intensity = 3;
                    } else {
                        intensity = 4;
                    }
                }

                days.add(new CalendarDayDto(date, day, true, eligibleCount, completed, percentage, intensity, false, isToday));
            }
        }

        return new CalendarMonthResponse(
                year,
                month,
                ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                period.getId(),
                period.getName(),
                days
        );
    }

    @Transactional(readOnly = true)
    public DailyChecklistResponse getDayDetails(UserPrincipal principal, UUID periodId, LocalDate date) {
        periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));

        return dailyTrackingService.getDailyChecklist(principal, date);
    }
}
