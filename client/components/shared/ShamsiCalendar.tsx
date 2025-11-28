// FILE: components/shared/ShamsiCalendar.tsx (FINAL GUARANTEED FIX)
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toJalaali, toGregorian } from "jalaali-js";

// --- Props Interface ---
interface ShamsiCalendarProps {
  onSelectDate: (date: string) => void; // <-- FIX: Prop now expects a string
  initialDate?: string; // <-- FIX: Prop is now a string 'YYYY-MM-DD'
  minDate?: Date;
}

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type JalaaliDate = { jy: number; jm: number; jd: number };

// --- FIX: A robust function to parse a 'YYYY-MM-DD' string into a Jalaali date ---
function jalaaliFromDateString(dateString: string): JalaaliDate {
    const [year, month, day] = dateString.split('-').map(Number);
    // Convert Gregorian parts to Jalaali
    return toJalaali(year, month, day);
}

// --- FIX: Converts Jalaali date parts to a standard 'YYYY-MM-DD' string ---
function dateStringToJalaali(jy: number, jm: number, jd: number): string {
    const g = toGregorian(jy, jm, jd);
    // Pad month and day with a leading zero if needed
    const month = String(g.gm).padStart(2, '0');
    const day = String(g.gd).padStart(2, '0');
    return `${g.gy}-${month}-${day}`;
}

function getDaysInPersianMonth(year: number, month: number): number {
  const g = toGregorian(year, month, 1);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextG = toGregorian(nextYear, nextMonth, 1);
  const date1 = new Date(g.gy, g.gm - 1, g.gd);
  const date2 = new Date(nextG.gy, nextG.gm - 1, nextG.gd);
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

export function ShamsiCalendar({ onSelectDate, initialDate, minDate: minDateProp }: ShamsiCalendarProps) {
  const today = useMemo(() => new Date(), []);

  // Get today as a 'YYYY-MM-DD' string
  const todayString = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [today]);

  const minDateJ = useMemo(() => {
    const min = minDateProp || today;
    return toJalaali(min.getFullYear(), min.getMonth() + 1, min.getDate());
  }, [minDateProp, today]);

  // All internal state now works with Jalaali objects, derived from strings
  const [display, setDisplay] = useState<JalaaliDate>(() => jalaaliFromDateString(initialDate || todayString));
  const [selected, setSelected] = useState<JalaaliDate | null>(() => (initialDate ? jalaaliFromDateString(initialDate) : null));

  // On initial render, if no date is selected, notify the parent of the default date.
  useEffect(() => {
      if (!selected) {
          onSelectDate(initialDate || todayString);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { jy: currentYear, jm: currentMonth } = display;

  const firstDayOfWeek = useMemo(() => {
    const g = toGregorian(currentYear, currentMonth, 1);
    const date = new Date(g.gy, g.gm - 1, g.gd);
    return (date.getDay() + 1) % 7;
  }, [currentYear, currentMonth]);

  const daysInMonth = useMemo(() => getDaysInPersianMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const isBeforeMin = (y: number, m: number, d: number) => {
    if (y < minDateJ.jy) return true;
    if (y === minDateJ.jy && m < minDateJ.jm) return true;
    if (y === minDateJ.jy && m === minDateJ.jm && d < minDateJ.jd) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isBeforeMin(currentYear, currentMonth, day)) return;
    const newSel: JalaaliDate = { jy: currentYear, jm: currentMonth, jd: day };
    setSelected(newSel);
    // Notify parent with the 'YYYY-MM-DD' string
    onSelectDate(dateStringToJalaali(newSel.jy, newSel.jm, newSel.jd));
  };
  
  const navigateMonth = (delta: number) => {
    setDisplay(prev => {
        let ny = prev.jy;
        let nm = prev.jm + delta;
        if (nm > 12) { nm = 1; ny++; }
        if (nm < 1) { nm = 12; ny--; }
        return { ...prev, jy: ny, jm: nm };
    });
  };

  const calendarGrid = useMemo(() => {
    const arr = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const todayJ = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <div className="p-3 w-full max-w-sm mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}><ChevronRight className="h-5 w-5" /></Button>
            <div className="text-sm font-semibold text-center">{PERSIAN_MONTHS[currentMonth - 1]} {currentYear.toLocaleString("fa-IR")}</div>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}><ChevronLeft className="h-5 w-5" /></Button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-gray-500">{PERSIAN_WEEKDAYS.map(day => <div key={day} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const isToday = todayJ.jy === currentYear && todayJ.jm === currentMonth && todayJ.jd === day;
                const isSelected = selected && selected.jy === currentYear && selected.jm === currentMonth && selected.jd === day;
                const isDisabled = isBeforeMin(currentYear, currentMonth, day);
                return (
                    <Button
                        key={day}
                        variant="ghost"
                        disabled={isDisabled}
                        onClick={() => handleSelectDay(day)}
                        className={cn("h-9 w-9 p-0 text-sm font-normal rounded-full", isToday && "border-2 border-blue-400", isSelected && "bg-primary text-primary-foreground", isDisabled && "text-gray-300")}>
                        {day.toLocaleString("fa-IR")}
                    </Button>
                );
            })}
        </div>
        {selected && (<div className="mt-4 p-2 bg-gray-50 rounded-lg text-center text-sm"><strong>تاریخ انتخابی:</strong> {selected.jd.toLocaleString("fa-IR")} {PERSIAN_MONTHS[selected.jm - 1]} {selected.jy.toLocaleString("fa-IR")}</div>)}
    </div>
  );
}

export default ShamsiCalendar;
