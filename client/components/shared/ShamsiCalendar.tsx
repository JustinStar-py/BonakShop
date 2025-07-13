// FILE: components/shared/ShamsiCalendar.tsx
// A reusable Persian (Shamsi) calendar component for date selection, designed to be used within a dialog.
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Standard and Corrected Persian Calendar Logic ---
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
  const jd = 1 + (days - ((jm > 6) ? ((jm - 7) * 30 + 186) : ((jm - 1) * 31)));
  return [jy, jm, jd];
}

function toGregorian(jy: number, jm: number, jd: number): Date {
    jy += 1595;
    let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
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
    const g_m_o = [31, (gy % 4 === 0 && gy % 100 !== 0 || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (let i = 0; i < 12; i++) {
        if (gd > g_m_o[i]) {
            gd -= g_m_o[i];
        } else {
            gm = i + 1;
            break;
        }
    }
    return new Date(gy, gm - 1, gd + 1);
}


function getDaysInPersianMonth(year: number, month: number): number {
  if (month < 7) return 31;
  if (month < 12) return 30;
  const isLeap = (((((year - (year > 0 ? 474 : 473)) % 2820) + 474 + 38) * 682) % 2816) < 682;
  return isLeap ? 30 : 29;
}

interface ShamsiCalendarProps {
  onDateSelect: (date: Date) => void;
  initialDate?: Date;
  minDate?: Date;
}

export function ShamsiCalendar({ onDateSelect, initialDate, minDate = new Date() }: ShamsiCalendarProps) {
  const today = new Date();
  const [todayYear, todayMonth, todayDay] = toPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  const minDatePersian = minDate ? toPersian(minDate.getFullYear(), minDate.getMonth() + 1, minDate.getDate()) : null;

  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = toGregorian(currentYear, currentMonth, 1);
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7; // 0: Saturday, ..., 6: Friday
    const daysInMonth = getDaysInPersianMonth(currentYear, currentMonth);

    const days = Array(firstDayOfWeek).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [currentYear, currentMonth]);

  const handleSelectDay = (day: number) => {
    const selectedGDate = toGregorian(currentYear, currentMonth, day);
    onDateSelect(selectedGDate);
  };

  const navigateMonth = (amount: number) => {
    let newMonth = currentMonth + amount;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };
  
  // FIX: Added { useGrouping: false } to prevent thousand separators.
  const formattedYear = currentYear.toLocaleString("fa-IR", { useGrouping: false });
  const formatDay = (day: number) => day.toLocaleString("fa-IR", { useGrouping: false });

  return (
    <div className="p-3 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="text-sm font-semibold text-center">
          {PERSIAN_MONTHS[currentMonth - 1]} {formattedYear}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-500">
        {PERSIAN_WEEKDAYS.map(day => <div key={day} className="py-2">{day}</div>)}
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