"use client";

import { useState } from "react";

interface SearchFilterBarProps {
  onSearch: (
    text: string,
    date: { start: string; end: string },
    type?: string,
  ) => void;
  placeholder?: string;
}

export default function SearchFilterBar({
  onSearch,
  placeholder = "Search...",
}: SearchFilterBarProps) {
  const [text, setText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeRange, setActiveRange] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const calculateRange = (range: string) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    let start = new Date(baseDate);
    let end = new Date(baseDate);

    switch (range) {
      case "daily":
        // start and end are already today
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        const dayOfWeek = baseDate.getDay();
        start.setDate(baseDate.getDate() - dayOfWeek); // Sunday
        end.setDate(start.getDate() + 6); // Saturday
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        start = new Date(baseDate.getFullYear(), 0, 1);
        end = new Date(baseDate.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      start: formatDate(start),
      end: formatDate(end),
    };
  };

  const handleApply = () => {
    onSearch(
      text,
      { start: startDate, end: endDate },
      activeRange || undefined,
    );
  };

  const handleRangeClick = (range: string) => {
    const isDeactivating = activeRange === range;
    const newRange = isDeactivating ? null : range;
    setActiveRange(newRange);

    let newDates = { start: "", end: "" };
    if (newRange) {
      newDates = calculateRange(newRange);
    }

    setStartDate(newDates.start);
    setEndDate(newDates.end);

    onSearch(text, newDates, newRange || undefined);
  };

  const handleReset = () => {
    setText("");
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    onSearch("", { start: "", end: "" });
  };

  return (
    <div className="flex flex-col gap-4 mb-10 stagger-items">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-primary/30 group-focus-within:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-300 glass-panel text-sm"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/5 active:scale-95"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-muted/50 hover:bg-muted border border-border rounded-xl text-foreground/40 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 mr-2">
            Timeline Filter:
          </span>
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
            {["daily", "weekly", "monthly", "yearly"].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeClick(range)}
                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeRange === range
                    ? "bg-primary text-background shadow-lg shadow-primary/20"
                    : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">
            Custom Range:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveRange(null);
                }}
                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
              />
            </div>
            <span className="text-primary/30 text-xs font-bold">—</span>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                To
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveRange(null);
                }}
                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
          {(startDate || endDate) && !activeRange && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in-scale">
              <span className="text-[9px] font-bold text-primary tabular-nums">
                {startDate || "—"}{" "}
                <span className="text-primary/30 mx-1">to</span>{" "}
                {endDate || "—"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
