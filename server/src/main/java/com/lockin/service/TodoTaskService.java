package com.lockin.service;

import com.lockin.dto.CreateTodoTaskRequest;
import com.lockin.dto.TodoTaskDto;
import com.lockin.dto.UpdateTodoTaskRequest;
import com.lockin.entity.LongTermGoalEntity;
import com.lockin.entity.TaskPriority;
import com.lockin.entity.TodoTaskEntity;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.LongTermGoalRepository;
import com.lockin.repository.TodoTaskRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TodoTaskService {

    private final TodoTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final LongTermGoalRepository goalRepository;

    public TodoTaskService(
            TodoTaskRepository taskRepository,
            UserRepository userRepository,
            LongTermGoalRepository goalRepository
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
    }

    @Transactional(readOnly = true)
    public List<TodoTaskDto> getTasks(UserPrincipal principal, LocalDate date, String view) {
        UUID userId = principal.getId();
        LocalDate today = LocalDate.now();
        List<TodoTaskEntity> tasks;

        if (date != null) {
            tasks = taskRepository.findByUserIdAndDueDateOrderByCompletedAscDisplayOrderAscCreatedAtAsc(userId, date);
        } else if ("overdue".equalsIgnoreCase(view)) {
            tasks = taskRepository.findByUserIdAndCompletedFalseAndDueDateBeforeOrderByDueDateAscCreatedAtAsc(userId, today);
        } else if ("upcoming".equalsIgnoreCase(view)) {
            tasks = taskRepository.findByUserIdAndDueDateGreaterThanEqualOrderByDueDateAscCompletedAscDisplayOrderAscCreatedAtAsc(userId, today);
        } else {
            tasks = taskRepository.findByUserIdOrderByDueDateAscCompletedAscDisplayOrderAscCreatedAtAsc(userId);
        }

        return tasks.stream().map(this::toDto).toList();
    }

    @Transactional
    public TodoTaskDto createTask(UserPrincipal principal, CreateTodoTaskRequest request) {
        UUID userId = principal.getId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        LocalDate dueDate = request.getDueDate() != null ? request.getDueDate() : LocalDate.now();
        TaskPriority priority = parsePriority(request.getPriority(), TaskPriority.MEDIUM);

        TodoTaskEntity task = new TodoTaskEntity();
        task.setUser(user);
        task.setTitle(request.getTitle().trim());
        task.setNotes(request.getNotes() != null && !request.getNotes().isBlank() ? request.getNotes().trim() : null);
        task.setDueDate(dueDate);
        task.setScheduledTime(request.getScheduledTime() != null && !request.getScheduledTime().isBlank()
                ? request.getScheduledTime().trim() : null);
        task.setPriority(priority);
        task.setCompleted(false);

        if (request.getGoalId() != null) {
            LongTermGoalEntity goal = goalRepository.findByIdAndUserId(request.getGoalId(), userId)
                    .orElseThrow(() -> new AppException("Linked long-term goal not found", HttpStatus.NOT_FOUND));
            task.setGoal(goal);
        }

        List<TodoTaskEntity> sameDay = taskRepository.findByUserIdAndDueDateOrderByCompletedAscDisplayOrderAscCreatedAtAsc(userId, dueDate);
        int nextOrder = sameDay.isEmpty() ? 0 : sameDay.stream().mapToInt(TodoTaskEntity::getDisplayOrder).max().orElse(0) + 1;
        task.setDisplayOrder(nextOrder);

        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TodoTaskDto updateTask(UserPrincipal principal, UUID taskId, UpdateTodoTaskRequest request) {
        UUID userId = principal.getId();
        TodoTaskEntity task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new AppException("Task not found", HttpStatus.NOT_FOUND));

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getNotes() != null) {
            task.setNotes(request.getNotes().isBlank() ? null : request.getNotes().trim());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getScheduledTime() != null) {
            task.setScheduledTime(request.getScheduledTime().isBlank() ? null : request.getScheduledTime().trim());
        }
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            task.setPriority(parsePriority(request.getPriority(), task.getPriority()));
        }
        if (Boolean.TRUE.equals(request.getClearGoal())) {
            task.setGoal(null);
        } else if (request.getGoalId() != null) {
            LongTermGoalEntity goal = goalRepository.findByIdAndUserId(request.getGoalId(), userId)
                    .orElseThrow(() -> new AppException("Linked long-term goal not found", HttpStatus.NOT_FOUND));
            task.setGoal(goal);
        }

        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TodoTaskDto toggleTask(UserPrincipal principal, UUID taskId) {
        TodoTaskEntity task = taskRepository.findByIdAndUserId(taskId, principal.getId())
                .orElseThrow(() -> new AppException("Task not found", HttpStatus.NOT_FOUND));

        boolean next = !task.isCompleted();
        task.setCompleted(next);
        task.setCompletedAt(next ? Instant.now() : null);

        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TodoTaskDto rescheduleTask(UserPrincipal principal, UUID taskId, LocalDate newDueDate) {
        if (newDueDate == null) {
            throw new AppException("New due date is required", HttpStatus.BAD_REQUEST);
        }
        TodoTaskEntity task = taskRepository.findByIdAndUserId(taskId, principal.getId())
                .orElseThrow(() -> new AppException("Task not found", HttpStatus.NOT_FOUND));

        task.setDueDate(newDueDate);
        return toDto(taskRepository.save(task));
    }

    @Transactional
    public int carryOverOverdueTasks(UserPrincipal principal, LocalDate targetDate) {
        LocalDate today = LocalDate.now();
        LocalDate destination = targetDate != null ? targetDate : today;
        List<TodoTaskEntity> overdue = taskRepository
                .findByUserIdAndCompletedFalseAndDueDateBeforeOrderByDueDateAscCreatedAtAsc(principal.getId(), today);

        for (TodoTaskEntity task : overdue) {
            task.setDueDate(destination);
        }
        taskRepository.saveAll(overdue);
        return overdue.size();
    }

    @Transactional
    public void deleteTask(UserPrincipal principal, UUID taskId) {
        TodoTaskEntity task = taskRepository.findByIdAndUserId(taskId, principal.getId())
                .orElseThrow(() -> new AppException("Task not found", HttpStatus.NOT_FOUND));
        taskRepository.delete(task);
    }

    private TaskPriority parsePriority(String raw, TaskPriority fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return TaskPriority.valueOf(raw.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException e) {
            throw new AppException("Invalid priority. Allowed: HIGH, MEDIUM, LOW", HttpStatus.BAD_REQUEST);
        }
    }

    private TodoTaskDto toDto(TodoTaskEntity entity) {
        return new TodoTaskDto(
                entity.getId(),
                entity.getTitle(),
                entity.getNotes(),
                entity.getDueDate(),
                entity.getScheduledTime(),
                entity.getPriority(),
                entity.isCompleted(),
                entity.getCompletedAt(),
                entity.getGoal() != null ? entity.getGoal().getId() : null,
                entity.getGoal() != null ? entity.getGoal().getTitle() : null,
                entity.getDisplayOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
