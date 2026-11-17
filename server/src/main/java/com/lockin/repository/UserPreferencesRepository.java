package com.lockin.repository;

import com.lockin.entity.UserPreferencesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferencesEntity, UUID> {
    Optional<UserPreferencesEntity> findByUserId(UUID userId);
}
