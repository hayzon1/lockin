package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.UserEntity;
import com.lockin.repository.HabitCompletionRepository;
import com.lockin.repository.HabitRepository;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AnalyticsServiceTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private CalendarService calendarService;

    @Autowired
    private PeriodService periodService;

    @Autowired
    private DailyTrackingService trackingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackingPeriodRepository periodRepository;

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private HabitCompletionRepository completionRepository;

    private UserPrincipal principal;
    private PeriodResponse period;

    @BeforeEach
    void setUp() {
        completionRepository.deleteAll();
        habitRepository.deleteAll();
        periodRepository.deleteAll();
        userRepository.deleteAll();

        UserEntity user = userRepository.save(new UserEntity("analytics_test@example.com", "hash"));
        user.setEmailVerified(true);
        user = userRepository.save(user);
        principal = UserPrincipal.create(user);

        LocalDate today = LocalDate.now();
        // 7-day period: 3 days ago to 3 days in future
        CreatePeriodRequest periodReq = new CreatePeriodRequest(
                "Analytics Sprint", "Desc", today.minusDays(3), today.plusDays(3),
                List.of("Reading", "Workout")
        );
        period = periodService.createPeriod(principal, periodReq);
    }

    @Test
    @DisplayName("Growth trajectory distinguishes elapsed dates from future dates")
    void shouldGenerateGrowthTrajectory() {
        LocalDate today = LocalDate.now();
        UUID reading = period.getHabits().get(0).getId();
        UUID workout = period.getHabits().get(1).getId();

        // Complete both habits on day -2
        trackingService.checkHabit(principal, reading, today.minusDays(2));
        trackingService.checkHabit(principal, workout, today.minusDays(2));

        // Complete 1 habit on day -1
        trackingService.checkHabit(principal, reading, today.minusDays(1));

        List<GrowthPointDto> trajectory = analyticsService.getGrowthTrajectory(principal, period.getId());

        assertEquals(7, trajectory.size(), "Should have exactly 7 points for a 7-day period");

        // Day -2
        GrowthPointDto dayMinus2 = trajectory.stream()
                .filter(p -> p.getDate().equals(today.minusDays(2)))
                .findFirst().orElseThrow();
        assertEquals(2, dayMinus2.getEligibleCount());
        assertEquals(2, dayMinus2.getCompletedCount());
        assertEquals(100.0, dayMinus2.getCompletionPercentage());
        assertFalse(dayMinus2.isFuture());
        assertTrue(dayMinus2.isElapsed());

        // Future day (+2)
        GrowthPointDto futurePoint = trajectory.stream()
                .filter(p -> p.getDate().equals(today.plusDays(2)))
                .findFirst().orElseThrow();
        assertTrue(futurePoint.isFuture());
        assertFalse(futurePoint.isElapsed());
        assertNull(futurePoint.getCompletionPercentage(), "Future dates must not show missed zero drops");
    }

    @Test
    @DisplayName("Period overview calculates streaks, total completions, and consistent habits")
    void shouldCalculatePeriodOverview() {
        LocalDate today = LocalDate.now();
        UUID reading = period.getHabits().get(0).getId();
        UUID workout = period.getHabits().get(1).getId();

        // 100% on -3, -2, -1
        trackingService.checkHabit(principal, reading, today.minusDays(3));
        trackingService.checkHabit(principal, workout, today.minusDays(3));
        trackingService.checkHabit(principal, reading, today.minusDays(2));
        trackingService.checkHabit(principal, workout, today.minusDays(2));
        trackingService.checkHabit(principal, reading, today.minusDays(1));
        trackingService.checkHabit(principal, workout, today.minusDays(1));

        PeriodOverviewAnalyticsDto overview = analyticsService.getPeriodOverview(principal, period.getId());

        assertEquals(2, overview.getTotalHabits());
        assertTrue(overview.getActualCompletedEntries() >= 6);
        assertEquals(3, overview.getLongestStreak());
        assertEquals(3, overview.getCurrentStreak());
        assertNotNull(overview.getBestPerformingDay());
        assertNotNull(overview.getMostConsistentHabit());
    }

    @Test
    @DisplayName("Per-habit analytics reports total completions and streak per habit")
    void shouldReportHabitAnalytics() {
        LocalDate today = LocalDate.now();
        UUID reading = period.getHabits().get(0).getId();

        trackingService.checkHabit(principal, reading, today.minusDays(2));
        trackingService.checkHabit(principal, reading, today.minusDays(1));

        List<HabitAnalyticsDto> habitStats = analyticsService.getHabitsAnalytics(principal, period.getId());
        assertEquals(2, habitStats.size());

        HabitAnalyticsDto readingStat = habitStats.stream()
                .filter(h -> h.getHabitId().equals(reading))
                .findFirst().orElseThrow();

        assertEquals(2, readingStat.getTotalCompletions());
        assertEquals(2, readingStat.getLongestStreak());
        assertTrue(readingStat.getCompletionDates().contains(today.minusDays(1)));
        assertTrue(readingStat.getCompletionDates().contains(today.minusDays(2)));
    }

    @Test
    @DisplayName("Calendar month view marks intensities and distinguishes in-period days")
    void shouldRenderCalendarMonthView() {
        LocalDate today = LocalDate.now();
        UUID reading = period.getHabits().get(0).getId();
        UUID workout = period.getHabits().get(1).getId();

        // Complete 100% on today.minusDays(1)
        trackingService.checkHabit(principal, reading, today.minusDays(1));
        trackingService.checkHabit(principal, workout, today.minusDays(1));

        CalendarMonthResponse calendar = calendarService.getMonthView(
                principal, period.getId(), today.getYear(), today.getMonthValue()
        );

        assertNotNull(calendar);
        assertEquals(today.getYear(), calendar.getYear());
        assertEquals(today.getMonthValue(), calendar.getMonth());
        assertFalse(calendar.getDays().isEmpty());

        CalendarDayDto day100 = calendar.getDays().stream()
                .filter(d -> d.getDate().equals(today.minusDays(1)))
                .findFirst().orElseThrow();

        assertTrue(day100.isInPeriod());
        assertEquals(4, day100.getIntensity(), "100% completion should have intensity 4");
    }

    @Test
    @DisplayName("Generates actionable insights from habit history")
    void shouldGenerateInsights() {
        LocalDate today = LocalDate.now();
        UUID reading = period.getHabits().get(0).getId();
        UUID workout = period.getHabits().get(1).getId();

        trackingService.checkHabit(principal, reading, today.minusDays(3));
        trackingService.checkHabit(principal, workout, today.minusDays(3));
        trackingService.checkHabit(principal, reading, today.minusDays(2));
        trackingService.checkHabit(principal, workout, today.minusDays(2));
        trackingService.checkHabit(principal, reading, today.minusDays(1));
        trackingService.checkHabit(principal, workout, today.minusDays(1));

        List<InsightDto> insights = analyticsService.getInsights(principal, period.getId());
        assertFalse(insights.isEmpty());
        assertTrue(insights.stream().anyMatch(i -> i.getTitle().contains("Streak") || i.getTitle().contains("Discipline")));
    }
}
