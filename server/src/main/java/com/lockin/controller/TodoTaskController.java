package com.lockin.controller;

import com.lockin.dto.ApiResponse;
import com.lockin.dto.CreateTodoTaskRequest;
import com.lockin.dto.TodoTaskDto;
import com.lockin.dto.UpdateTodoTaskRequest;
import com.lockin.security.UserPrincipal;
import com.lockin.service.TodoTaskService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/todos")
public class TodoTaskController {

    private final TodoTaskService todoTaskService;

    public TodoTaskController(TodoTaskService todoTaskService) {
        this.todoTaskService = todoTaskService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TodoTaskDto>>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String view
    ) {
        return ResponseEntity.ok(ApiResponse.success(todoTaskService.getTasks(principal, date, view)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TodoTaskDto>> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTodoTaskRequest request
    ) {
        TodoTaskDto created = todoTaskService.createTask(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Task added to your plan"));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TodoTaskDto>> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTodoTaskRequest request
    ) {
        TodoTaskDto updated = todoTaskService.updateTask(principal, taskId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task updated"));
    }

    @PatchMapping("/{taskId}/toggle")
    public ResponseEntity<ApiResponse<TodoTaskDto>> toggleTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId
    ) {
        TodoTaskDto toggled = todoTaskService.toggleTask(principal, taskId);
        return ResponseEntity.ok(ApiResponse.success(toggled));
    }

    @PatchMapping("/{taskId}/reschedule")
    public ResponseEntity<ApiResponse<TodoTaskDto>> rescheduleTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId,
            @RequestBody Map<String, String> body
    ) {
        String dueDateStr = body.get("dueDate");
        LocalDate newDate = (dueDateStr != null && !dueDateStr.isBlank()) ? LocalDate.parse(dueDateStr) : null;
        TodoTaskDto updated = todoTaskService.rescheduleTask(principal, taskId, newDate);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task rescheduled"));
    }

    @PostMapping("/carry-over")
    public ResponseEntity<ApiResponse<Map<String, Object>>> carryOverOverdue(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, String> body
    ) {
        LocalDate target = (body != null && body.get("targetDate") != null && !body.get("targetDate").isBlank())
                ? LocalDate.parse(body.get("targetDate"))
                : LocalDate.now();
        int moved = todoTaskService.carryOverOverdueTasks(principal, target);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("movedCount", moved, "targetDate", target.toString()),
                "Moved " + moved + " overdue task(s) to " + target
        ));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId
    ) {
        todoTaskService.deleteTask(principal, taskId);
        return ResponseEntity.ok(ApiResponse.success(null, "Task deleted"));
    }
}
