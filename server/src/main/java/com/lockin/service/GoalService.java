package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.*;
import com.lockin.exception.AppException;
import com.lockin.repository.*;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class GoalService {

    private final LongTermGoalRepository goalRepository;
    private final GoalMilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final TrackingPeriodRepository periodRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final AtomicHabitsCoachService coachService;

    public GoalService(
            LongTermGoalRepository goalRepository,
            GoalMilestoneRepository milestoneRepository,
            UserRepository userRepository,
            TrackingPeriodRepository periodRepository,
            HabitRepository habitRepository,
            HabitCompletionRepository completionRepository,
            AtomicHabitsCoachService coachService
    ) {
        this.goalRepository = goalRepository;
        this.milestoneRepository = milestoneRepository;
        this.userRepository = userRepository;
        this.periodRepository = periodRepository;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.coachService = coachService;
    }

    @Transactional(readOnly = true)
    public List<LongTermGoalDto> getUserGoals(UserPrincipal principal) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(goal -> toDto(goal, principal.getId()))
                .toList();
    }

    @Transactional
    public LongTermGoalDto createGoal(UserPrincipal principal, CreateGoalRequest request) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        String title = request.getTitle().trim();
        String description = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription().trim() : null;
        String category = request.getCategory() != null && !request.getCategory().isBlank()
                ? request.getCategory().trim().toUpperCase(Locale.ENGLISH) : "PERSONAL";
        String identityInput = request.getIdentityStatement() != null && !request.getIdentityStatement().isBlank()
                ? request.getIdentityStatement().trim() : null;

        AtomicHabitsCoachService.GoalBlueprint blueprint = coachService.generateBlueprint(
                title, description, category, identityInput, request.getTargetDate()
        );

        LongTermGoalEntity goal = new LongTermGoalEntity();
        goal.setUser(user);
        goal.setTitle(title);
        goal.setDescription(description);
        goal.setCategory(category);
        goal.setTargetDate(request.getTargetDate());
        goal.setStatus(GoalStatus.ACTIVE);
        applyBlueprint(goal, blueprint);

        LongTermGoalEntity saved = goalRepository.save(goal);
        return toDto(saved, principal.getId());
    }

    @Transactional
    public LongTermGoalDto regenerateBlueprint(UserPrincipal principal, UUID goalId) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        AtomicHabitsCoachService.GoalBlueprint blueprint = coachService.generateBlueprint(
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory(),
                goal.getIdentityStatement(),
                goal.getTargetDate()
        );

        // Keep already completed milestones, replace uncompleted suggested blueprint items cleanly
        goal.getMilestones().clear();
        goal.getSuggestedHabits().clear();
        goalRepository.flush();

        applyBlueprint(goal, blueprint);
        LongTermGoalEntity saved = goalRepository.save(goal);
        return toDto(saved, principal.getId());
    }

    @Transactional
    public LongTermGoalDto toggleMilestone(UserPrincipal principal, UUID goalId, UUID milestoneId) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        GoalMilestoneEntity milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new AppException("Milestone not found", HttpStatus.NOT_FOUND));

        boolean nextCompleted = !milestone.isCompleted();
        milestone.setCompleted(nextCompleted);
        milestone.setCompletedAt(nextCompleted ? Instant.now() : null);
        milestoneRepository.save(milestone);

        return toDto(goal, principal.getId());
    }

    @Transactional
    public LongTermGoalDto addMilestone(UserPrincipal principal, UUID goalId, CreateMilestoneRequest request) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        int nextOrder = goal.getMilestones().size();
        GoalMilestoneEntity milestone = new GoalMilestoneEntity();
        milestone.setGoal(goal);
        milestone.setTitle(request.getTitle().trim());
        milestone.setDescription(request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription().trim() : null);
        milestone.setTargetDate(request.getTargetDate() != null ? request.getTargetDate() : goal.getTargetDate());
        milestone.setDisplayOrder(nextOrder);
        milestone.setCompleted(false);

        goal.getMilestones().add(milestone);
        LongTermGoalEntity saved = goalRepository.save(goal);
        return toDto(saved, principal.getId());
    }

    @Transactional
    public LongTermGoalDto updateStatus(UserPrincipal principal, UUID goalId, String statusStr) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        GoalStatus nextStatus;
        try {
            nextStatus = GoalStatus.valueOf(statusStr.trim().toUpperCase(Locale.ENGLISH));
        } catch (Exception e) {
            throw new AppException("Invalid goal status. Allowed: ACTIVE, COMPLETED, ARCHIVED", HttpStatus.BAD_REQUEST);
        }

        goal.setStatus(nextStatus);
        LongTermGoalEntity saved = goalRepository.save(goal);
        return toDto(saved, principal.getId());
    }

    @Transactional
    public void deleteGoal(UserPrincipal principal, UUID goalId) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));
        goalRepository.delete(goal);
    }

    @Transactional
    public Map<String, Object> adoptSuggestedHabits(UserPrincipal principal, UUID goalId, AdoptHabitsRequest request) {
        UUID userId = principal.getId();
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        Set<UUID> selectedIds = new HashSet<>(request.getSuggestedHabitIds());
        List<GoalSuggestedHabitEntity> selected = goal.getSuggestedHabits().stream()
                .filter(sh -> selectedIds.contains(sh.getId()))
                .toList();

        if (selected.isEmpty()) {
            throw new AppException("None of the selected suggested habits were found for this goal", HttpStatus.BAD_REQUEST);
        }

        String mode = request.getMode() != null ? request.getMode().trim().toUpperCase(Locale.ENGLISH) : "ADD_TO_ACTIVE_PERIOD";
        TrackingPeriodEntity targetPeriod;

        if ("START_NEW_PERIOD".equals(mode)) {
            Optional<TrackingPeriodEntity> existingActive = periodRepository.findByUserIdAndStatus(userId, PeriodStatus.ACTIVE);
            if (existingActive.isPresent()) {
                if (request.isReplaceActivePeriod()) {
                    TrackingPeriodEntity prev = existingActive.get();
                    prev.setStatus(PeriodStatus.COMPLETED);
                    periodRepository.saveAndFlush(prev);
                } else {
                    throw new AppException(
                            "You already have an active tracking period. Choose 'Add to Active Period' or enable replacing it.",
                            HttpStatus.CONFLICT
                    );
                }
            }

            int days = (request.getPresetDays() != null && request.getPresetDays() >= 7 && request.getPresetDays() <= 180)
                    ? request.getPresetDays() : 30;
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusDays(days - 1L);

            String periodName = (request.getPeriodName() != null && !request.getPeriodName().isBlank())
                    ? request.getPeriodName().trim()
                    : days + "-Day Sprint: " + truncate(goal.getTitle(), 90);

            targetPeriod = new TrackingPeriodEntity(
                    user,
                    periodName,
                    "Atomic habits sprint supporting long-term goal: " + goal.getTitle(),
                    startDate,
                    endDate
            );
            targetPeriod = periodRepository.save(targetPeriod);
        } else {
            targetPeriod = periodRepository.findByUserIdAndStatus(userId, PeriodStatus.ACTIVE)
                    .orElseThrow(() -> new AppException(
                            "No active tracking period found. Choose 'Start New Period' instead to begin tracking immediately.",
                            HttpStatus.BAD_REQUEST
                    ));
        }

        List<HabitEntity> existingHabits = habitRepository.findByPeriodIdAndUserIdOrderByDisplayOrderAsc(targetPeriod.getId(), userId);
        int nextOrder = existingHabits.isEmpty() ? 0 : existingHabits.get(existingHabits.size() - 1).getDisplayOrder() + 1;

        LocalDate today = LocalDate.now();
        LocalDate effectiveStart = today.isBefore(targetPeriod.getStartDate()) ? targetPeriod.getStartDate() : today;

        int addedCount = 0;
        for (GoalSuggestedHabitEntity suggestion : selected) {
            HabitEntity habit = new HabitEntity(user, targetPeriod, suggestion.getName(), effectiveStart, nextOrder++);
            habit.setGoal(goal);
            habit.setCategory(suggestion.getCategory());
            habit.setDescription(suggestion.getWhyItWorks());
            habit.setTwoMinuteVersion(suggestion.getTwoMinuteVersion());
            habit.setHabitStackCue(suggestion.getHabitStackCue());
            habitRepository.save(habit);

            suggestion.setAdopted(true);
            addedCount++;
        }

        goalRepository.save(goal);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("addedHabitsCount", addedCount);
        result.put("periodId", targetPeriod.getId());
        result.put("periodName", targetPeriod.getName());
        result.put("goal", toDto(goal, userId));
        return result;
    }

    private void applyBlueprint(LongTermGoalEntity goal, AtomicHabitsCoachService.GoalBlueprint blueprint) {
        goal.setAiProvider(blueprint.provider());
        goal.setIdentityStatement(blueprint.identityStatement());
        goal.setRoadmapSummary(blueprint.roadmapSummary());

        int mOrder = 0;
        for (AtomicHabitsCoachService.MilestonePlan m : blueprint.milestones()) {
            GoalMilestoneEntity entity = new GoalMilestoneEntity();
            entity.setGoal(goal);
            entity.setTitle(m.title());
            entity.setDescription(m.description());
            entity.setTargetDate(m.targetDate());
            entity.setDisplayOrder(mOrder++);
            entity.setCompleted(false);
            goal.getMilestones().add(entity);
        }

        int hOrder = 0;
        for (AtomicHabitsCoachService.HabitPlan h : blueprint.suggestedHabits()) {
            GoalSuggestedHabitEntity entity = new GoalSuggestedHabitEntity();
            entity.setGoal(goal);
            entity.setName(h.name());
            entity.setTwoMinuteVersion(h.twoMinuteVersion());
            entity.setHabitStackCue(h.habitStackCue());
            entity.setCategory(h.category());
            entity.setWhyItWorks(h.whyItWorks());
            entity.setDisplayOrder(hOrder++);
            entity.setAdopted(false);
            goal.getSuggestedHabits().add(entity);
        }
    }

    private LongTermGoalDto toDto(LongTermGoalEntity goal, UUID userId) {
        LocalDate today = LocalDate.now();
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(today, goal.getTargetDate()));

        List<GoalMilestoneDto> milestoneDtos = goal.getMilestones().stream()
                .map(m -> new GoalMilestoneDto(
                        m.getId(),
                        m.getTitle(),
                        m.getDescription(),
                        m.getTargetDate(),
                        m.getDisplayOrder(),
                        m.isCompleted(),
                        m.getCompletedAt()
                ))
                .toList();

        List<GoalSuggestedHabitDto> suggestedDtos = goal.getSuggestedHabits().stream()
                .map(sh -> new GoalSuggestedHabitDto(
                        sh.getId(),
                        sh.getName(),
                        sh.getTwoMinuteVersion(),
                        sh.getHabitStackCue(),
                        sh.getCategory(),
                        sh.getWhyItWorks(),
                        sh.getDisplayOrder(),
                        sh.isAdopted()
                ))
                .toList();

        List<HabitEntity> linkedHabits = habitRepository.findByGoalIdAndUserId(goal.getId(), userId);
        int linkedCount = linkedHabits.size();
        long identityVotes = 0;
        if (!linkedHabits.isEmpty()) {
            List<UUID> habitIds = linkedHabits.stream().map(HabitEntity::getId).toList();
            identityVotes = completionRepository.countByHabitIdIn(habitIds);
        }

        int progressPct = 0;
        if (goal.getStatus() == GoalStatus.COMPLETED) {
            progressPct = 100;
        } else if (!milestoneDtos.isEmpty()) {
            long completedMilestones = milestoneDtos.stream().filter(GoalMilestoneDto::isCompleted).count();
            progressPct = (int) Math.round(((double) completedMilestones / milestoneDtos.size()) * 100.0);
        }

        return new LongTermGoalDto(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory(),
                goal.getIdentityStatement(),
                goal.getTargetDate(),
                daysRemaining,
                goal.getStatus(),
                goal.getAiProvider(),
                goal.getRoadmapSummary(),
                milestoneDtos,
                suggestedDtos,
                linkedCount,
                identityVotes,
                progressPct,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen).trim();
    }
}
