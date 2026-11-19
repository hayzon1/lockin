package com.lockin.controller;

import com.lockin.dto.ApiResponse;
import com.lockin.dto.CalendarMonthResponse;
import com.lockin.dto.DailyChecklistResponse;
import com.lockin.security.UserPrincipal;
import com.lockin.service.CalendarService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping("/month")
    public ResponseEntity<ApiResponse<CalendarMonthResponse>> getMonthView(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID periodId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        CalendarMonthResponse response = calendarService.getMonthView(principal, periodId, year, month);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/day")
    public ResponseEntity<ApiResponse<DailyChecklistResponse>> getDayDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID periodId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        DailyChecklistResponse response = calendarService.getDayDetails(principal, periodId, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
