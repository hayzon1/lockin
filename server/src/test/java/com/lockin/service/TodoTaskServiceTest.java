package com.lockin.service;

import com.lockin.dto.*;
import com.lockin.entity.TaskPriority;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class TodoTaskServiceTest {

    @Autowired
    private TodoTaskService todoTaskService;

    @Autowired
    private AuthService authService;

    @Autowired
    private GoalService goalService;

    @Autowired
    private UserRepository userRepository;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        String email = "todotest-" + UUID.randomUUID() + "@example.com";
        authService.register(new RegisterRequest(email, "Password123!", "Password123!"));
        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        principal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("Create tasks for today and tomorrow, toggle completion, and reschedule")
    void shouldCreateToggleAndRescheduleTasks() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        CreateTodoTaskRequest todayReq = new CreateTodoTaskRequest();
        todayReq.setTitle("Ship to-do planner");
        todayReq.setPriority("HIGH");
        todayReq.setDueDate(today);
        todayReq.setScheduledTime("10:00");

        CreateTodoTaskRequest tomorrowReq = new CreateTodoTaskRequest();
        tomorrowReq.setTitle("Review weekly analytics");
        tomorrowReq.setPriority("LOW");
        tomorrowReq.setDueDate(tomorrow);

        TodoTaskDto todayTask = todoTaskService.createTask(principal, todayReq);
        TodoTaskDto tomorrowTask = todoTaskService.createTask(principal, tomorrowReq);

        assertEquals(TaskPriority.HIGH, todayTask.getPriority());
        assertEquals("10:00", todayTask.getScheduledTime());
        assertFalse(todayTask.isCompleted());

        // Toggle today's task complete
        TodoTaskDto toggled = todoTaskService.toggleTask(principal, todayTask.getId());
        assertTrue(toggled.isCompleted());
        assertNotNull(toggled.getCompletedAt());

        // Query by date
        List<TodoTaskDto> tomorrowTasks = todoTaskService.getTasks(principal, tomorrow, null);
        assertEquals(1, tomorrowTasks.size());
        assertEquals(tomorrowTask.getId(), tomorrowTasks.get(0).getId());

        // Reschedule tomorrow's task to next week
        LocalDate nextWeek = today.plusDays(7);
        TodoTaskDto moved = todoTaskService.rescheduleTask(principal, tomorrowTask.getId(), nextWeek);
        assertEquals(nextWeek, moved.getDueDate());
    }

    @Test
    @DisplayName("Carry over overdue incomplete tasks to today")
    void shouldCarryOverOverdueTasks() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        CreateTodoTaskRequest overdueReq = new CreateTodoTaskRequest();
        overdueReq.setTitle("Call dentist");
        overdueReq.setDueDate(yesterday);
        todoTaskService.createTask(principal, overdueReq);

        List<TodoTaskDto> overdueBefore = todoTaskService.getTasks(principal, null, "overdue");
        assertEquals(1, overdueBefore.size());

        int movedCount = todoTaskService.carryOverOverdueTasks(principal, LocalDate.now());
        assertEquals(1, movedCount);

        List<TodoTaskDto> overdueAfter = todoTaskService.getTasks(principal, null, "overdue");
        assertTrue(overdueAfter.isEmpty());

        List<TodoTaskDto> todayTasks = todoTaskService.getTasks(principal, LocalDate.now(), null);
        assertEquals(1, todayTasks.size());
        assertEquals("Call dentist", todayTasks.get(0).getTitle());
    }

    @Test
    @DisplayName("Link a planned task to a long-term goal")
    void shouldLinkTaskToGoal() {
        CreateGoalRequest goalReq = new CreateGoalRequest();
        goalReq.setTitle("Run a 10K");
        goalReq.setCategory("FITNESS");
        goalReq.setTargetDate(LocalDate.now().plusDays(120));
        LongTermGoalDto goal = goalService.createGoal(principal, goalReq);

        CreateTodoTaskRequest taskReq = new CreateTodoTaskRequest();
        taskReq.setTitle("Buy running shoes");
        taskReq.setDueDate(LocalDate.now().plusDays(1));
        taskReq.setGoalId(goal.getId());

        TodoTaskDto created = todoTaskService.createTask(principal, taskReq);
        assertEquals(goal.getId(), created.getGoalId());
        assertEquals("Run a 10K", created.getGoalTitle());
    }
}
