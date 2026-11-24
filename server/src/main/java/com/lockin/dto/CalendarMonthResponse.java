package com.lockin.dto;

import java.util.List;
import java.util.UUID;

public class CalendarMonthResponse {
    private int year;
    private int month;
    private String monthName;
    private UUID periodId;
    private String periodName;
    private List<CalendarDayDto> days;

    public CalendarMonthResponse() {}

    public CalendarMonthResponse(int year, int month, String monthName, UUID periodId, String periodName, List<CalendarDayDto> days) {
        this.year = year;
        this.month = month;
        this.monthName = monthName;
        this.periodId = periodId;
        this.periodName = periodName;
        this.days = days;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    public UUID getPeriodId() {
        return periodId;
    }

    public void setPeriodId(UUID periodId) {
        this.periodId = periodId;
    }

    public String getPeriodName() {
        return periodName;
    }

    public void setPeriodName(String periodName) {
        this.periodName = periodName;
    }

    public List<CalendarDayDto> getDays() {
        return days;
    }

    public void setDays(List<CalendarDayDto> days) {
        this.days = days;
    }
}
