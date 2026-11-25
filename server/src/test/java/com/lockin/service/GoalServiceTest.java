package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.GoalStatus;
import com.lockin.entity.UserEntity;
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
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "app.ai.gemini-api-key=")
@Transactional
class GoalServiceTest {

    @Autowired
    private GoalService goalService;

    @Autowired
    private AuthService authService;

    @Autowired
    private DailyTrackingService dailyTrackingService;

    @Autowired
    private UserRepository userRepository;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        String email = "goaltest-" + UUID.randomUUID() + "@example.com";
        RegisterRequest req = new RegisterRequest(email, "Password123!", "Password123!");
        authService.register(req);
        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        principal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("Creating a long-term goal generates Atomic Habits milestones and 2-minute fallback habits")
    void shouldCreateGoalWithAtomicHabitsBlueprint() {
        CreateGoalRequest req = new CreateGoalRequest();
        req.setTitle("Run a half marathon");
        req.setCategory("FITNESS");
        req.setDescription("Currently running 2km twice a week");
        req.setTargetDate(LocalDate.now().plusDays(180));

        LongTermGoalDto goal = goalService.createGoal(principal, req);

        assertNotNull(goal.getId());
        assertEquals("Run a half marathon", goal.getTitle());
        assertEquals("BUILT_IN", goal.getAiProvider());
        assertNotNull(goal.getIdentityStatement());
        assertFalse(goal.getIdentityStatement().isBlank());
        assertFalse(goal.getMilestones().isEmpty());
        assertTrue(goal.getSuggestedHabits().size() >= 3);
        assertTrue(goal.getSuggestedHabits().stream().allMatch(h ->
                h.getTwoMinuteVersion() != null && !h.getTwoMinuteVersion().isBlank() &&
                h.getHabitStackCue() != null && !h.getHabitStackCue().isBlank()
        ));
    }

    @Test
    @DisplayName("Toggling milestones updates goal progress percentage")
    void shouldUpdateProgressWhenTogglingMilestones() {
        CreateGoalRequest req = new CreateGoalRequest();
        req.setTitle("Save $10,000 emergency fund");
        req.setCategory("FINANCE");
        req.setTargetDate(LocalDate.now().plusDays(365));

        LongTermGoalDto goal = goalService.createGoal(principal, req);
        assertEquals(0, goal.getProgressPercentage());

        UUID firstMilestoneId = goal.getMilestones().get(0).getId();
        LongTermGoalDto updated = goalService.toggleMilestone(principal, goal.getId(), firstMilestoneId);

        assertTrue(updated.getMilestones().get(0).isCompleted());
        assertTrue(updated.getProgressPercentage() > 0);
    }

    @Test
    @DisplayName("Adopting suggested habits starts a tracking period and links identity votes on check-in")
    void shouldAdoptHabitsAndTrackIdentityVotes() {
        CreateGoalRequest req = new CreateGoalRequest();
        req.setTitle("Become a senior Java backend engineer");
        req.setCategory("CAREER");
        req.setTargetDate(LocalDate.now().plusDays(180));

        LongTermGoalDto goal = goalService.createGoal(principal, req);
        List<UUID> habitIds = goal.getSuggestedHabits().stream()
                .limit(2)
                .map(GoalSuggestedHabitDto::getId)
                .toList();

        AdoptHabitsRequest adoptReq = new AdoptHabitsRequest();
        adoptReq.setSuggestedHabitIds(habitIds);
        adoptReq.setMode("START_NEW_PERIOD");
        adoptReq.setPresetDays(30);

        Map<String, Object> adoptResult = goalService.adoptSuggestedHabits(principal, goal.getId(), adoptReq);
        assertEquals(2, adoptResult.get("addedHabitsCount"));

        DailyChecklistResponse checklist = dailyTrackingService.getDailyChecklist(principal, LocalDate.now());
        assertEquals(2, checklist.getHabits().size());
        DailyChecklistItemDto firstItem = checklist.getHabits().get(0);
        assertEquals(goal.getId(), firstItem.getGoalId());
        assertNotNull(firstItem.getTwoMinuteVersion());
        assertNotNull(firstItem.getHabitStackCue());

        // Check off first habit -> should register 1 identity vote on the long-term goal
        dailyTrackingService.checkHabit(principal, firstItem.getHabitId(), LocalDate.now());

        List<LongTermGoalDto> goals = goalService.getUserGoals(principal);
        assertEquals(1, goals.size());
        assertEquals(2, goals.get(0).getLinkedHabitsCount());
        assertEquals(1L, goals.get(0).getIdentityVotesCount());
    }

    @Test
    @DisplayName("Can add custom milestone and update goal status")
    void shouldAddCustomMilestoneAndUpdateStatus() {
        CreateGoalRequest req = new CreateGoalRequest();
        req.setTitle("Read 24 books this year");
        req.setCategory("READING");
        req.setTargetDate(LocalDate.now().plusDays(300));

        LongTermGoalDto goal = goalService.createGoal(principal, req);
        int before = goal.getMilestones().size();

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setTitle("Finish first 6 books");
        msReq.setDescription("Complete 2 books per month for Q1");
        msReq.setTargetDate(LocalDate.now().plusDays(90));

        LongTermGoalDto withMilestone = goalService.addMilestone(principal, goal.getId(), msReq);
        assertEquals(before + 1, withMilestone.getMilestones().size());

        LongTermGoalDto completed = goalService.updateStatus(principal, goal.getId(), "COMPLETED");
        assertEquals(GoalStatus.COMPLETED, completed.getStatus());
        assertEquals(100, completed.getProgressPercentage());
    }
}
