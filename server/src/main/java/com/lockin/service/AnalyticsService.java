package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.HabitCompletionEntity;
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
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TrackingPeriodRepository periodRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final DailyTrackingService dailyTrackingService;

    public AnalyticsService(
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
    public List<GrowthPointDto> getGrowthTrajectory(UserPrincipal principal, UUID periodId) {
        TrackingPeriodEntity period = getPeriodAndVerify(principal, periodId);
        List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());

        LocalDate today = LocalDate.now();
        List<GrowthPointDto> trajectory = new ArrayList<>();

        for (LocalDate date = period.getStartDate(); !date.isAfter(period.getEndDate()); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            boolean isFuture = date.isAfter(today);
            String dayOfWeek = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            if (isFuture) {
                long eligibleScheduled = habits.stream()
                        .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, currentDate))
                        .count();
                trajectory.add(new GrowthPointDto(date, dayOfWeek, (int) eligibleScheduled, 0, null, true, false));
            } else {
                List<HabitEntity> eligible = habits.stream()
                        .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, currentDate))
                        .toList();

                Set<UUID> eligibleIds = eligible.stream().map(HabitEntity::getId).collect(Collectors.toSet());
                int completedCount = eligibleIds.isEmpty() ? 0 :
                        completionRepository.findByHabitIdInAndCompletionDate(eligibleIds, date).size();

                int eligibleCount = eligible.size();
                Double percentage = eligibleCount == 0 ? null :
                        Math.round(((double) completedCount / eligibleCount) * 1000.0) / 10.0;

                trajectory.add(new GrowthPointDto(date, dayOfWeek, eligibleCount, completedCount, percentage, false, true));
            }
        }

        return trajectory;
    }

    @Transactional(readOnly = true)
    public PeriodOverviewAnalyticsDto getPeriodOverview(UserPrincipal principal, UUID periodId) {
        TrackingPeriodEntity period = getPeriodAndVerify(principal, periodId);
        List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());

        LocalDate today = LocalDate.now();
        LocalDate lastElapsedDate = period.getEndDate().isBefore(today) ? period.getEndDate() : today;

        int totalPossible = 0;
        int totalActual = 0;
        double sumPercentages = 0.0;
        int daysWithHabitsCount = 0;

        LocalDate bestDay = null;
        double bestDayPercentage = -1.0;

        int currentStreak = 0;
        int longestStreak = 0;
        int tempStreak = 0;

        for (LocalDate date = period.getStartDate(); !date.isAfter(lastElapsedDate); date = date.plusDays(1)) {
            final LocalDate checkDate = date;
            List<HabitEntity> eligible = habits.stream()
                    .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, checkDate))
                    .toList();

            int eligibleCount = eligible.size();
            totalPossible += eligibleCount;

            Set<UUID> eligibleIds = eligible.stream().map(HabitEntity::getId).collect(Collectors.toSet());
            int completedCount = eligibleIds.isEmpty() ? 0 :
                    completionRepository.findByHabitIdInAndCompletionDate(eligibleIds, date).size();
            totalActual += completedCount;

            if (eligibleCount > 0) {
                double pct = ((double) completedCount / eligibleCount) * 100.0;
                sumPercentages += pct;
                daysWithHabitsCount++;

                if (pct > bestDayPercentage) {
                    bestDayPercentage = pct;
                    bestDay = date;
                }

                // Streak counts days where 100% of eligible habits were completed
                if (completedCount == eligibleCount) {
                    tempStreak++;
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                } else {
                    tempStreak = 0;
                }
            } else {
                tempStreak = 0;
            }
        }

        // Current streak calculation (from today or yesterday backwards)
        currentStreak = calculateCurrentStreak(habits, period, today);

        Double overallPercentage = totalPossible == 0 ? null :
                Math.round(((double) totalActual / totalPossible) * 1000.0) / 10.0;

        Double avgDaily = daysWithHabitsCount == 0 ? null :
                Math.round((sumPercentages / daysWithHabitsCount) * 10.0) / 10.0;

        Double bestPercentage = bestDay != null ? Math.round(bestDayPercentage * 10.0) / 10.0 : null;

        // Consistency ranking across habits
        String mostConsistent = null;
        String leastConsistent = null;
        double highestRate = -1.0;
        double lowestRate = 101.0;

        for (HabitEntity habit : habits) {
            int eligibleDays = 0;
            for (LocalDate d = period.getStartDate(); !d.isAfter(lastElapsedDate); d = d.plusDays(1)) {
                if (dailyTrackingService.isHabitEligibleOnDate(habit, d)) {
                    eligibleDays++;
                }
            }
            if (eligibleDays > 0) {
                long completions = completionRepository.countByHabitIdAndCompletionDateBetween(
                        habit.getId(), period.getStartDate(), lastElapsedDate
                );
                double rate = ((double) completions / eligibleDays) * 100.0;

                if (rate > highestRate) {
                    highestRate = rate;
                    mostConsistent = habit.getName();
                }
                if (rate < lowestRate) {
                    lowestRate = rate;
                    leastConsistent = habit.getName();
                }
            }
        }

        return new PeriodOverviewAnalyticsDto(
                habits.size(),
                totalPossible,
                totalActual,
                overallPercentage,
                avgDaily,
                currentStreak,
                longestStreak,
                bestDay,
                bestPercentage,
                mostConsistent,
                leastConsistent
        );
    }

    @Transactional(readOnly = true)
    public List<HabitAnalyticsDto> getHabitsAnalytics(UserPrincipal principal, UUID periodId) {
        TrackingPeriodEntity period = getPeriodAndVerify(principal, periodId);
        List<HabitEntity> habits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(periodId, principal.getId());

        LocalDate today = LocalDate.now();
        LocalDate lastElapsed = period.getEndDate().isBefore(today) ? period.getEndDate() : today;

        List<HabitAnalyticsDto> result = new ArrayList<>();

        for (HabitEntity habit : habits) {
            int eligibleDays = 0;
            for (LocalDate d = period.getStartDate(); !d.isAfter(lastElapsed); d = d.plusDays(1)) {
                if (dailyTrackingService.isHabitEligibleOnDate(habit, d)) {
                    eligibleDays++;
                }
            }

            List<HabitCompletionEntity> completions = completionRepository.findByHabitIdOrderByCompletionDateAsc(habit.getId());
            Set<LocalDate> completionDates = completions.stream()
                    .map(HabitCompletionEntity::getCompletionDate)
                    .filter(d -> !d.isBefore(period.getStartDate()) && !d.isAfter(period.getEndDate()))
                    .collect(Collectors.toSet());

            int totalCompletions = (int) completionDates.stream().filter(d -> !d.isAfter(lastElapsed)).count();
            Double percentage = eligibleDays == 0 ? null :
                    Math.round(((double) totalCompletions / eligibleDays) * 1000.0) / 10.0;

            // Calculate habit streaks
            int longestStreak = 0;
            int tempStreak = 0;
            for (LocalDate d = period.getStartDate(); !d.isAfter(lastElapsed); d = d.plusDays(1)) {
                if (completionDates.contains(d)) {
                    tempStreak++;
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                } else if (dailyTrackingService.isHabitEligibleOnDate(habit, d)) {
                    tempStreak = 0;
                }
            }

            int currentStreak = 0;
            LocalDate check = today.isAfter(period.getEndDate()) ? period.getEndDate() : today;
            if (!completionDates.contains(check)) {
                check = check.minusDays(1);
            }
            while (!check.isBefore(period.getStartDate()) && completionDates.contains(check)) {
                currentStreak++;
                check = check.minusDays(1);
            }

            result.add(new HabitAnalyticsDto(
                    habit.getId(),
                    habit.getName(),
                    habit.getCategory(),
                    totalCompletions,
                    eligibleDays,
                    percentage,
                    currentStreak,
                    longestStreak,
                    completionDates.stream().sorted().toList()
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<InsightDto> getInsights(UserPrincipal principal, UUID periodId) {
        PeriodOverviewAnalyticsDto overview = getPeriodOverview(principal, periodId);
        List<InsightDto> insights = new ArrayList<>();

        if (overview.getTotalPossibleCompletions() < 3) {
            insights.add(new InsightDto(
                    "NEUTRAL",
                    "Early Days",
                    "Track habits consistently for at least 3 days to unlock personalized data insights."
            ));
            return insights;
        }

        if (overview.getOverallCompletionPercentage() != null) {
            if (overview.getOverallCompletionPercentage() >= 80.0) {
                insights.add(new InsightDto(
                        "POSITIVE",
                        "Exceptional Discipline",
                        String.format("You are performing at an impressive %.1f%% overall consistency for this tracking period.", overview.getOverallCompletionPercentage())
                ));
            } else if (overview.getOverallCompletionPercentage() >= 50.0) {
                insights.add(new InsightDto(
                        "NEUTRAL",
                        "Building Momentum",
                        String.format("You have achieved %.1f%% consistency. Focus on preserving your daily minimums.", overview.getOverallCompletionPercentage())
                ));
            } else {
                insights.add(new InsightDto(
                        "TIP",
                        "Focus Opportunity",
                        "Consistency over perfection. Shrink daily requirements if habits feel overwhelming."
                ));
            }
        }

        if (overview.getCurrentStreak() >= 3) {
            insights.add(new InsightDto(
                    "POSITIVE",
                    "Active Streak",
                    String.format("You have completed all eligible habits for %d days in a row.", overview.getCurrentStreak())
            ));
        }

        if (overview.getMostConsistentHabit() != null) {
            insights.add(new InsightDto(
                    "POSITIVE",
                    "Strongest Anchor",
                    String.format("'%s' is your most consistently maintained habit in this tracking period.", overview.getMostConsistentHabit())
            ));
        }

        if (overview.getLeastConsistentHabit() != null && !overview.getLeastConsistentHabit().equals(overview.getMostConsistentHabit())) {
            insights.add(new InsightDto(
                    "TIP",
                    "Area for Improvement",
                    String.format("'%s' has the lowest completion rate. Consider attaching it to a stronger habit cue.", overview.getLeastConsistentHabit())
            ));
        }

        return insights;
    }

    private int calculateCurrentStreak(List<HabitEntity> habits, TrackingPeriodEntity period, LocalDate today) {
        LocalDate check = today.isAfter(period.getEndDate()) ? period.getEndDate() : today;

        // Check if today was 100% completed, if not check yesterday
        if (!isFullCompletionDay(habits, check)) {
            check = check.minusDays(1);
        }

        int streak = 0;
        while (!check.isBefore(period.getStartDate()) && isFullCompletionDay(habits, check)) {
            streak++;
            check = check.minusDays(1);
        }
        return streak;
    }

    private boolean isFullCompletionDay(List<HabitEntity> habits, LocalDate date) {
        List<HabitEntity> eligible = habits.stream()
                .filter(h -> dailyTrackingService.isHabitEligibleOnDate(h, date))
                .toList();

        if (eligible.isEmpty()) {
            return false;
        }

        Set<UUID> ids = eligible.stream().map(HabitEntity::getId).collect(Collectors.toSet());
        int completed = completionRepository.findByHabitIdInAndCompletionDate(ids, date).size();
        return completed == eligible.size();
    }

    private TrackingPeriodEntity getPeriodAndVerify(UserPrincipal principal, UUID periodId) {
        return periodRepository.findByIdAndUserId(periodId, principal.getId())
                .orElseThrow(() -> new AppException("Tracking period not found", HttpStatus.NOT_FOUND));
    }
}
