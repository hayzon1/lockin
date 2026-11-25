package com.lockin.repository;

import com.lockin.entity.HabitCompletionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitCompletionRepository extends JpaRepository<HabitCompletionEntity, UUID> {

    Optional<HabitCompletionEntity> findByHabitIdAndCompletionDate(UUID habitId, LocalDate completionDate);

    boolean existsByHabitIdAndCompletionDate(UUID habitId, LocalDate completionDate);

    void deleteByHabitIdAndCompletionDate(UUID habitId, LocalDate completionDate);

    List<HabitCompletionEntity> findByUserIdAndCompletionDate(UUID userId, LocalDate completionDate);

    List<HabitCompletionEntity> findByHabitIdInAndCompletionDate(Collection<UUID> habitIds, LocalDate completionDate);

    List<HabitCompletionEntity> findByHabitIdInAndCompletionDateBetween(
            Collection<UUID> habitIds, LocalDate startDate, LocalDate endDate);

    List<HabitCompletionEntity> findByHabitIdOrderByCompletionDateAsc(UUID habitId);

    long countByHabitId(UUID habitId);

    long countByHabitIdIn(Collection<UUID> habitIds);

    long countByHabitIdAndCompletionDateBetween(UUID habitId, LocalDate startDate, LocalDate endDate);
}
