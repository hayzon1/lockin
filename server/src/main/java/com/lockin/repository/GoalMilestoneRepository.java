package com.lockin.repository;

import com.lockin.entity.GoalMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GoalMilestoneRepository extends JpaRepository<GoalMilestoneEntity, UUID> {
    Optional<GoalMilestoneEntity> findByIdAndGoalId(UUID id, UUID goalId);
}
