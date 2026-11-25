package com.lockin.repository;

import com.lockin.entity.TodoTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TodoTaskRepository extends JpaRepository<TodoTaskEntity, UUID> {
    List<TodoTaskEntity> findByUserIdAndDueDateOrderByCompletedAscDisplayOrderAscCreatedAtAsc(UUID userId, LocalDate dueDate);
    List<TodoTaskEntity> findByUserIdAndDueDateGreaterThanEqualOrderByDueDateAscCompletedAscDisplayOrderAscCreatedAtAsc(UUID userId, LocalDate fromDate);
    List<TodoTaskEntity> findByUserIdAndCompletedFalseAndDueDateBeforeOrderByDueDateAscCreatedAtAsc(UUID userId, LocalDate beforeDate);
    List<TodoTaskEntity> findByUserIdOrderByDueDateAscCompletedAscDisplayOrderAscCreatedAtAsc(UUID userId);
    Optional<TodoTaskEntity> findByIdAndUserId(UUID id, UUID userId);
}
