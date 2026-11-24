package com.lockin.service;

import com.lockin.dto.CreatePeriodRequest;
import com.lockin.dto.PeriodResponse;
import com.lockin.dto.UpdatePeriodRequest;
import com.lockin.entity.PeriodStatus;
import com.lockin.entity.UserEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.TrackingPeriodRepository;
import com.lockin.repository.UserRepository;
import com.lockin.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class PeriodServiceTest {

    @Autowired
    private PeriodService periodService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackingPeriodRepository periodRepository;

    private UserEntity userA;
    private UserEntity userB;
    private UserPrincipal principalA;
    private UserPrincipal principalB;

    @BeforeEach
    void setUp() {
        periodRepository.deleteAll();
        userRepository.deleteAll();

        userA = userRepository.save(new UserEntity("usera@example.com", "hashA"));
        userA.setEmailVerified(true);
        userA = userRepository.save(userA);
        principalA = UserPrincipal.create(userA);

        userB = userRepository.save(new UserEntity("userb@example.com", "hashB"));
        userB.setEmailVerified(true);
        userB = userRepository.save(userB);
        principalB = UserPrincipal.create(userB);
    }

    @Test
    @DisplayName("Successfully creates tracking period with preset days and seeds initial habits")
    void shouldCreatePeriodWithPresetsAndHabits() {
        LocalDate startDate = LocalDate.now();
        CreatePeriodRequest request = new CreatePeriodRequest();
        request.setName("30-Day Sprint");
        request.setDescription("Daily discipline");
        request.setStartDate(startDate);
        request.setPresetDays(30);
        request.setHabitNames(List.of("Morning Run", "Read 20 Pages", "Meditation"));

        PeriodResponse response = periodService.createPeriod(principalA, request);

        assertNotNull(response.getId());
        assertEquals("30-Day Sprint", response.getName());
        assertEquals(startDate, response.getStartDate());
        assertEquals(startDate.plusDays(29), response.getEndDate());
        assertEquals(30, response.getTotalDays());
        assertEquals(PeriodStatus.ACTIVE, response.getStatus());
        assertEquals(3, response.getHabits().size());
        assertEquals("Morning Run", response.getHabits().get(0).getName());
        assertEquals(0, response.getHabits().get(0).getDisplayOrder());
    }

    @Test
    @DisplayName("Prevents creating a second active tracking period")
    void shouldRejectSecondActivePeriod() {
        CreatePeriodRequest first = new CreatePeriodRequest(
                "Sprint 1", "Desc", LocalDate.now(), LocalDate.now().plusDays(14), List.of("Run")
        );
        periodService.createPeriod(principalA, first);

        CreatePeriodRequest second = new CreatePeriodRequest(
                "Sprint 2", "Desc", LocalDate.now(), LocalDate.now().plusDays(14), List.of("Gym")
        );

        AppException ex = assertThrows(AppException.class, () -> periodService.createPeriod(principalA, second));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getMessage().contains("active tracking period already exists"));
    }

    @Test
    @DisplayName("Rejects period when start date is after end date")
    void shouldRejectInvalidDateRange() {
        CreatePeriodRequest request = new CreatePeriodRequest(
                "Invalid Dates", null, LocalDate.now().plusDays(10), LocalDate.now(), null
        );

        AppException ex = assertThrows(AppException.class, () -> periodService.createPeriod(principalA, request));
        assertTrue(ex.getMessage().contains("Start date must be before or equal to end date"));
    }

    @Test
    @DisplayName("Completing a period marks it COMPLETED and makes it read-only")
    void shouldCompletePeriodAndEnforceReadOnly() {
        CreatePeriodRequest req = new CreatePeriodRequest(
                "Active Sprint", null, LocalDate.now(), LocalDate.now().plusDays(7), List.of("Habit")
        );
        PeriodResponse created = periodService.createPeriod(principalA, req);

        PeriodResponse completed = periodService.completePeriod(principalA, created.getId());
        assertEquals(PeriodStatus.COMPLETED, completed.getStatus());

        UpdatePeriodRequest updateReq = new UpdatePeriodRequest("Modified Name", "New Desc");
        AppException ex = assertThrows(AppException.class, () -> periodService.updatePeriod(principalA, created.getId(), updateReq));
        assertTrue(ex.getMessage().contains("read-only"));
    }

    @Test
    @DisplayName("Strict user data isolation: User cannot access another user's period")
    void shouldEnforceUserIsolation() {
        CreatePeriodRequest req = new CreatePeriodRequest(
                "User A Sprint", null, LocalDate.now(), LocalDate.now().plusDays(7), null
        );
        PeriodResponse created = periodService.createPeriod(principalA, req);

        AppException ex = assertThrows(AppException.class, () -> periodService.getPeriodById(principalB, created.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
