"use client";

import { useState } from "react";

interface SearchFilterBarProps {
  onSearch: (text: string, date: { start: string; end: string }) => void;
  placeholder?: string;
}

export default function SearchFilterBar({
  onSearch,
  placeholder = "Search...",
}: SearchFilterBarProps) {
  const [text, setText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleApply = () => {
    onSearch(text, { start: startDate, end: endDate });
  };

  const handleReset = () => {
    setText("");
    setStartDate("");
    setEndDate("");
    onSearch("", { start: "", end: "" });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
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

      {/* Date Filters */}
      <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
            From
          </span>
          <input
            type="date"
            className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 glass-panel"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">
            To
          </span>
          <input
            type="date"
            className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 glass-panel"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground/40 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
