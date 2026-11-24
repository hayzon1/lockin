package com.lockin.service;

import com.lockin.dto.CreateHabitRequest;
import com.lockin.dto.CreatePeriodRequest;
import com.lockin.dto.DailyChecklistResponse;
import com.lockin.dto.PeriodResponse;
import com.lockin.entity.HabitEntity;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
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
class DailyTrackingServiceTest {

    @Autowired
    private DailyTrackingService trackingService;

    @Autowired
    private HabitService habitService;

    @Autowired
    private PeriodService periodService;

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

        UserEntity user = userRepository.save(new UserEntity("tracking_test@example.com", "hash"));
        user.setEmailVerified(true);
        user = userRepository.save(user);
        principal = UserPrincipal.create(user);

        LocalDate today = LocalDate.now();
        CreatePeriodRequest periodReq = new CreatePeriodRequest(
                "Discipline Block", "Desc", today.minusDays(2), today.plusDays(10),
                List.of("Morning Run", "Deep Work", "Meditation")
        );
        period = periodService.createPeriod(principal, periodReq);
    }

    @Test
    @DisplayName("Checking habits updates checklist, completed count, and daily percentage")
    void shouldCheckHabitsAndCalculatePercentage() {
        LocalDate today = LocalDate.now();
        UUID habit1 = period.getHabits().get(0).getId();
        UUID habit2 = period.getHabits().get(1).getId();

        DailyChecklistResponse res1 = trackingService.checkHabit(principal, habit1, today);
        assertEquals(3, res1.getEligibleCount());
        assertEquals(1, res1.getCompletedCount());
        assertEquals(33.3, res1.getCompletionPercentage());

        DailyChecklistResponse res2 = trackingService.checkHabit(principal, habit2, today);
        assertEquals(3, res2.getEligibleCount());
        assertEquals(2, res2.getCompletedCount());
        assertEquals(66.7, res2.getCompletionPercentage());
    }

    @Test
    @DisplayName("Checking an already checked habit is idempotent and avoids duplicates")
    void shouldBeIdempotentOnDuplicateCheck() {
        LocalDate today = LocalDate.now();
        UUID habit1 = period.getHabits().get(0).getId();

        trackingService.checkHabit(principal, habit1, today);
        DailyChecklistResponse secondCheck = trackingService.checkHabit(principal, habit1, today);

        assertEquals(1, secondCheck.getCompletedCount());
        assertEquals(33.3, secondCheck.getCompletionPercentage());
    }

    @Test
    @DisplayName("Unchecking a habit decreases completed count and updates percentage")
    void shouldUncheckHabit() {
        LocalDate today = LocalDate.now();
        UUID habit1 = period.getHabits().get(0).getId();

        trackingService.checkHabit(principal, habit1, today);
        DailyChecklistResponse unchecked = trackingService.uncheckHabit(principal, habit1, today);

        assertEquals(0, unchecked.getCompletedCount());
        assertEquals(0.0, unchecked.getCompletionPercentage());
    }

    @Test
    @DisplayName("Habit eligibility respects effective start dates and archiving")
    void shouldRespectEffectiveDateAndArchiving() {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(3);

        // Add a habit that starts in the future
        CreateHabitRequest newHabitReq = new CreateHabitRequest("Future Habit", null, null, futureDate);
        habitService.createHabit(principal, period.getId(), newHabitReq);

        DailyChecklistResponse todayChecklist = trackingService.getDailyChecklist(principal, today);
        assertEquals(3, todayChecklist.getEligibleCount(), "Future habit must not be eligible today");

        DailyChecklistResponse futureChecklist = trackingService.getDailyChecklist(principal, futureDate);
        assertEquals(4, futureChecklist.getEligibleCount(), "Future habit must be eligible on its effective date");
    }

    @Test
    @DisplayName("Archived habit retains historical eligibility but is not eligible on future dates")
    void shouldArchiveHabitWithoutLosingHistory() {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        UUID habit1 = period.getHabits().get(0).getId();

        // Check on past date
        trackingService.checkHabit(principal, habit1, pastDate);

        // Archive habit today
        habitService.archiveHabit(principal, habit1);

        // Check past date checklist
        DailyChecklistResponse pastChecklist = trackingService.getDailyChecklist(principal, pastDate);
        assertTrue(pastChecklist.getHabits().stream().anyMatch(h -> h.getHabitId().equals(habit1)));
    }

    @Test
    @DisplayName("Checking habits on completed period is prohibited")
    void shouldRejectCheckingOnCompletedPeriod() {
        LocalDate today = LocalDate.now();
        UUID habit1 = period.getHabits().get(0).getId();

        periodService.completePeriod(principal, period.getId());

        AppException ex = assertThrows(AppException.class, () -> trackingService.checkHabit(principal, habit1, today));
        assertTrue(ex.getMessage().contains("completed tracking period"));
    }
}
