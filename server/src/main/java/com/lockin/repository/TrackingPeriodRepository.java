package com.lockin.repository;

import com.lockin.entity.PeriodStatus;
import com.lockin.entity.TrackingPeriodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrackingPeriodRepository extends JpaRepository<TrackingPeriodEntity, UUID> {

    Optional<TrackingPeriodEntity> findByUserIdAndStatus(UUID userId, PeriodStatus status);

    List<TrackingPeriodEntity> findByUserIdOrderByStartDateDesc(UUID userId);

    Optional<TrackingPeriodEntity> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndStatus(UUID userId, PeriodStatus status);

    long countByStatus(PeriodStatus status);
}
