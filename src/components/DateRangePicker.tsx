"use client";

import { useState, useRef, useEffect } from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = parseDate(startDate);
    return d || new Date();
  });
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const clicked = new Date(year, month, day);
    if (selecting === "start") {
      onRangeChange(toDateStr(clicked), "");
      setSelecting("end");
    } else {
      const s = start!;
      if (clicked < s) {
        onRangeChange(toDateStr(clicked), toDateStr(s));
      } else {
        onRangeChange(toDateStr(s), toDateStr(clicked));
      }
      setSelecting("start");
    }
  };

  const getDayState = (day: number) => {
    const d = new Date(year, month, day);
    const isStart = start && isSameDay(d, start);
    const isEnd = end && isSameDay(d, end);

    let rangeStart = start;
    let rangeEnd = end;

    // If selecting end, use hover for preview
    if (selecting === "end" && start && !end && hoverDate) {
      rangeEnd = hoverDate >= start ? hoverDate : start;
      rangeStart = hoverDate >= start ? start : hoverDate;
    }

    const inRange = rangeStart && rangeEnd && d > rangeStart && d < rangeEnd;
    const isRangeStart = rangeStart && isSameDay(d, rangeStart);
    const isRangeEnd = rangeEnd && isSameDay(d, rangeEnd);
    const isToday = isSameDay(d, today);

    return { isStart, isEnd, inRange, isRangeStart, isRangeEnd, isToday };
  };

  const displayLabel = () => {
    if (startDate && endDate) {
      const s = parseDate(startDate)!;
      const e = parseDate(endDate)!;
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (startDate) {
      const s = parseDate(startDate)!;
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ...`;
    }
    return "Select dates";
  };

  return (
    <div className="relative z-50" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`h-8 px-3 flex items-center gap-2 rounded-md border text-xs transition-colors ${
          open || startDate
            ? "border-foreground/20 bg-secondary text-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <span className="whitespace-nowrap">{displayLabel()}</span>
        {(startDate || endDate) && (
          <span
            onClick={(e) => { e.stopPropagation(); onRangeChange("", ""); setSelecting("start"); }}
            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
          >
            ×
          </span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 card p-4 shadow-xl animate-fade-in w-[280px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-medium text-foreground">
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Selecting hint */}
          <p className="text-[11px] text-muted-foreground text-center mb-2">
            {selecting === "start" ? "Select start date" : "Select end date"}
          </p>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { isRangeStart, isRangeEnd, inRange, isToday } = getDayState(day);
              const isEndpoint = isRangeStart || isRangeEnd;

              return (
                <div
                  key={day}
                  className={`relative h-8 flex items-center justify-center ${
                    inRange ? "bg-foreground/[0.06]" : ""
                  } ${isRangeStart ? "rounded-l-md bg-foreground/[0.06]" : ""} ${isRangeEnd ? "rounded-r-md bg-foreground/[0.06]" : ""}`}
                >
                  <button
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoverDate(new Date(year, month, day))}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors relative z-10
                      ${isEndpoint
                        ? "bg-foreground text-background font-semibold"
                        : isToday
                          ? "border border-foreground/20 text-foreground"
                          : "text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {(startDate || endDate) && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{displayLabel()}</span>
              <button
                onClick={() => { onRangeChange("", ""); setSelecting("start"); }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
