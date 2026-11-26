package com.lockin.repository;

import com.lockin.entity.LearningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LearningPlanRepository extends JpaRepository<LearningPlanEntity, UUID> {
    Optional<LearningPlanEntity> findByGoalId(UUID goalId);
}
