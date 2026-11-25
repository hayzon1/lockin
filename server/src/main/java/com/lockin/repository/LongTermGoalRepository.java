package com.lockin.repository;

import com.lockin.entity.LongTermGoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LongTermGoalRepository extends JpaRepository<LongTermGoalEntity, UUID> {
    List<LongTermGoalEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<LongTermGoalEntity> findByIdAndUserId(UUID id, UUID userId);
}
