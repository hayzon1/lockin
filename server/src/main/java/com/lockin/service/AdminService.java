package com.lockin.service;

import com.lockin.dto.AdminStatsDto;
import com.lockin.dto.AdminUserItemDto;
import com.lockin.entity.HabitEntity;
import com.lockin.entity.PeriodStatus;
import com.lockin.entity.TrackingPeriodEntity;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.HabitCompletionRepository;
import com.lockin.repository.HabitRepository;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final TrackingPeriodRepository periodRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;

    public AdminService(
            UserRepository userRepository,
            TrackingPeriodRepository periodRepository,
            HabitRepository habitRepository,
            HabitCompletionRepository completionRepository
    ) {
        this.userRepository = userRepository;
        this.periodRepository = periodRepository;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto getAdminStats(UserPrincipal principal) {
        verifyAdmin(principal);

        long totalUsers = userRepository.count();
        long verifiedUsers = userRepository.countByEmailVerifiedTrue();
        long totalPeriods = periodRepository.count();
        long activePeriods = periodRepository.countByStatus(PeriodStatus.ACTIVE);
        long totalCompletions = completionRepository.count();

        List<UserEntity> allUsers = userRepository.findAll();

        // Gender demographics
        Map<String, Long> genderDistribution = allUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getGender() != null && !u.getGender().trim().isEmpty()
                                ? u.getGender().trim().toUpperCase()
                                : "NOT_SPECIFIED",
                        Collectors.counting()
                ));

        // Average Age
        Double averageAge = allUsers.stream()
                .map(UserEntity::getAge)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .stream()
                .boxed()
                .findFirst()
                .orElse(null);

        // Platform completion rate
        Double completionRate = totalUsers > 0 && totalCompletions > 0
                ? Math.min(100.0, ((double) totalCompletions / (Math.max(1, totalPeriods * 10))) * 10.0)
                : 0.0;

        return new AdminStatsDto(
                totalUsers,
                verifiedUsers,
                totalPeriods,
                activePeriods,
                totalCompletions,
                completionRate,
                genderDistribution,
                averageAge
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserItemDto> getAdminUsers(UserPrincipal principal) {
        verifyAdmin(principal);

        List<UserEntity> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AdminUserItemDto> result = new ArrayList<>();

        for (UserEntity user : users) {
            Optional<TrackingPeriodEntity> activePeriodOpt = periodRepository.findByUserIdAndStatus(user.getId(), PeriodStatus.ACTIVE);
            String activePeriodName = activePeriodOpt.map(TrackingPeriodEntity::getName).orElse(null);
            Integer activePeriodDays = activePeriodOpt.map(p -> (int) ChronoUnit.DAYS.between(p.getStartDate(), p.getEndDate()) + 1).orElse(null);

            List<HabitEntity> habits = habitRepository.findByUserId(user.getId());
            int totalHabits = habits.size();

            int totalCompletions = 0;
            for (HabitEntity h : habits) {
                totalCompletions += completionRepository.countByHabitId(h.getId());
            }

            result.add(new AdminUserItemDto(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getAge(),
                    user.getGender(),
                    user.getRole(),
                    user.isEmailVerified(),
                    user.getCreatedAt(),
                    activePeriodName,
                    activePeriodDays,
                    totalHabits,
                    totalCompletions,
                    0 // streak placeholder
            ));
        }

        return result;
    }

    @Transactional
    public void updateUserRole(UserPrincipal principal, UUID targetUserId, String newRole) {
        verifyAdmin(principal);

        if (!"ADMIN".equalsIgnoreCase(newRole) && !"USER".equalsIgnoreCase(newRole)) {
            throw new AppException("Invalid role. Must be 'ADMIN' or 'USER'", HttpStatus.BAD_REQUEST);
        }

        UserEntity user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        user.setRole(newRole.toUpperCase());
        userRepository.save(user);
    }

    private void verifyAdmin(UserPrincipal principal) {
        if (principal == null) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        if (!"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw new AppException("Access denied: Administrator privileges required", HttpStatus.FORBIDDEN);
        }
    }
}
