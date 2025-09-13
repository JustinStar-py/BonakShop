// FILE: components/shared/ShamsiCalendar.tsx (Updated)
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Props Interface ---
// <-- 1. Define the props for the component
interface ShamsiCalendarProps {
    initialDate?: Date;
    onSelectDate: (date: Date) => void; // The function to call when a date is selected
}

// --- Persian Calendar Logic (remains the same) ---
const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function toPersian(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gy = (gm > 2) ? gy : gy - 1;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy += 1595;
    let days = -355668 + (365 * jy) + Math.floor(jy / 33 * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return [gy, gm, gd]; 
}

// --- Component ---
export function ShamsiCalendar({ initialDate, onSelectDate }: ShamsiCalendarProps) { // <-- 2. Receive props
    const today = new Date();
    const [currentShamsiDate, setCurrentShamsiDate] = useState(() => toPersian(today.getFullYear(), today.getMonth() + 1, today.getDate()));
    const [currentYear, currentMonth, currentDay] = currentShamsiDate;
    
    const { minDatePersian, todayYear, todayMonth, todayDay } = useMemo(() => {
        const minDate = new Date();
        return {
            minDatePersian: toPersian(minDate.getFullYear(), minDate.getMonth() + 1, minDate.getDate()),
            todayYear: currentYear,
            todayMonth: currentMonth,
            todayDay: currentDay,
        };
    }, [currentYear, currentMonth, currentDay]);

    const handleMonthChange = (offset: number) => {
        setCurrentShamsiDate(prev => {
            let newMonth = prev[1] + offset;
            let newYear = prev[0];
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            } else if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            return [newYear, newMonth, 1];
        });
    };

    const handleSelectDay = (day: number) => {
        const [gy, gm, gd] = toGregorian(currentYear, currentMonth, day);
        const selectedDate = new Date(gy, gm - 1, gd);
        onSelectDate(selectedDate); // <-- 3. Call the passed function with the new date
    };

    const calendarGrid = useMemo(() => {
        const daysInMonth = (currentMonth <= 6) ? 31 : (currentMonth <= 11) ? 30 : (currentYear % 4 === 3 && currentYear % 100 !== 99) || (currentYear % 400 === 399) ? 30 : 29;
        const [firstDayGregorian] = toGregorian(currentYear, currentMonth, 1);
        const firstDay = new Date(firstDayGregorian, currentMonth -1, 1).getDay(); // (0-6, Sun-Sat)
        const firstDayOfWeek = (firstDay + 1) % 7; // Convert to Shamsi week (0-6, Sat-Fri)
        
        const grid: (number | null)[] = Array(firstDayOfWeek).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [currentYear, currentMonth]);
    
    const formatDay = (day: number) => new Intl.NumberFormat('fa-IR').format(day);
    
    return (
        <div className="p-3 border rounded-md">
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}><ChevronRight className="h-4 w-4" /></Button>
                <div className="font-bold text-center">{PERSIAN_MONTHS[currentMonth - 1]} {formatDay(currentYear)}</div>
                <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)}><ChevronLeft className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-500">
                {PERSIAN_WEEKDAYS.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} />;
                    }
                    
                    let isSelectable = true;
                    if (minDatePersian) {
                        if (currentYear < minDatePersian[0]) isSelectable = false;
                        if (currentYear === minDatePersian[0] && currentMonth < minDatePersian[1]) isSelectable = false;
                        if (currentYear === minDatePersian[0] && currentMonth === minDatePersian[1] && day < minDatePersian[2]) isSelectable = false;
                    }

                    const isSelected = initialDate && toPersian(initialDate.getFullYear(), initialDate.getMonth()+1, initialDate.getDate()).join(',') === [currentYear, currentMonth, day].join(',');
                    const isToday = todayYear === currentYear && todayMonth === currentMonth && todayDay === day;

                    return (
                        <Button
                            key={day}
                            variant="ghost"
                            disabled={!isSelectable}
                            onClick={() => handleSelectDay(day)}
                            className={cn("h-9 w-9 p-0 text-sm font-normal rounded-full",
                                isToday && "border border-blue-400",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                !isSelectable && "text-gray-300"
                            )}
                        >
                            {formatDay(day)}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}