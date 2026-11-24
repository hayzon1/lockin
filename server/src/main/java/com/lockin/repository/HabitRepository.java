package com.lockin.repository;

import com.lockin.entity.HabitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<HabitEntity, UUID> {

    List<HabitEntity> findByPeriodIdAndUserIdOrderByDisplayOrderAsc(UUID periodId, UUID userId);

    List<HabitEntity> findByUserId(UUID userId);

    Optional<HabitEntity> findByIdAndUserId(UUID id, UUID userId);
}
