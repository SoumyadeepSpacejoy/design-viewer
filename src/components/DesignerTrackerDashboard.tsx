"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminTimeTracker } from "@/app/types";
import { searchAdminTimeTrackers } from "@/app/clientApi";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

export default function DesignerTrackerDashboard() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<AdminTimeTracker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & filter state (inline, not a separate component)
  const [searchText, setSearchText] = useState("");
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 30;
  const skipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const searchRef = useRef({ text: "", date: { start: "", end: "" }, filterType: "" });
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const calculateRange = (range: string) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    let start = new Date(baseDate);
    let end = new Date(baseDate);
    switch (range) {
      case "daily": end.setHours(23, 59, 59, 999); break;
      case "weekly":
        start.setDate(baseDate.getDate() - baseDate.getDay());
        end.setDate(start.getDate() + 6);
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
    return { start: formatDate(start), end: formatDate(end) };
  };

  const loadTrackers = useCallback(async (reset: boolean = false) => {
    if (isLoadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    const currentSkip = reset ? 0 : skipRef.current;
    const { text, date, filterType } = searchRef.current;

    try {
      const data = await searchAdminTimeTrackers(text, date, currentSkip, limit, filterType || undefined);
      if (reset) {
        setTrackers(data);
      } else {
        setTrackers((prev) => [...prev, ...data]);
      }
      skipRef.current = currentSkip + limit;
      const more = data.length >= limit;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (error) {
      console.error("Error loading trackers:", error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrackers(true);
  }, [loadTrackers]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMoreRef.current) {
          loadTrackers(false);
        }
      },
      { root: scrollContainer, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadTrackers]);

  const triggerSearch = (text: string, date: { start: string; end: string }, filterType?: string) => {
    searchRef.current = { text, date, filterType: filterType || "" };
    skipRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setTrackers([]);
    setTimeout(() => loadTrackers(true), 0);
  };

  const handleSearchSubmit = () => {
    triggerSearch(searchText, { start: startDate, end: endDate }, activeRange || undefined);
  };

  const handleRangeClick = (range: string) => {
    const isDeactivating = activeRange === range;
    const newRange = isDeactivating ? null : range;
    setActiveRange(newRange);
    let newDates = { start: "", end: "" };
    if (newRange) newDates = calculateRange(newRange);
    setStartDate(newDates.start);
    setEndDate(newDates.end);
    triggerSearch(searchText, newDates, newRange || undefined);
  };

  const handleReset = () => {
    setSearchText("");
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    triggerSearch("", { start: "", end: "" });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trackers.length && trackers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trackers.map((t) => t._id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedTrackers = trackers.filter((t) => selectedIds.has(t._id));
  const selectedEarnings = selectedTrackers.reduce((sum, t) => sum + t.earnings, 0);
  const selectedTime = selectedTrackers.reduce((sum, t) => sum + t.totalTimeSpend, 0);

  return (
    <div className="animate-fade-in -m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Toolbar ── */}
      <div className="shrink-0 bg-card border-b border-border px-4 py-2.5 flex flex-col gap-2">
        {/* Row 1: title + search */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-sm font-semibold text-foreground whitespace-nowrap mr-2">Designer Insights</h1>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input h-8 text-xs"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Search designers or projects..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />
          </div>

          {/* Quick period pills */}
          <div className="flex items-center gap-1">
            {["daily", "weekly", "monthly", "yearly"].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeClick(range)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all ${
                  activeRange === range
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Calendar date range picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
              setActiveRange(null);
              if (s && e) {
                triggerSearch(searchText, { start: s, end: e });
              } else if (!s && !e) {
                triggerSearch(searchText, { start: "", end: "" });
              }
            }}
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={handleSearchSubmit} className="btn btn-primary h-8 text-xs px-3">
              Search
            </button>
            {(searchText || startDate || endDate || activeRange) && (
              <button onClick={handleReset} className="btn btn-ghost h-8 text-xs px-3">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div className="shrink-0 bg-muted/60 border-b border-border flex items-center px-4 h-9 text-[11px] font-semibold text-muted-foreground select-none">
        <div className="w-9 shrink-0">
          <button
            onClick={toggleSelectAll}
            className={`w-4 h-4 rounded border-[1.5px] transition-all flex items-center justify-center ${
              selectedIds.size === trackers.length && trackers.length > 0
                ? "bg-primary border-primary"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            {selectedIds.size === trackers.length && trackers.length > 0 && (
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        <div className="w-[200px] shrink-0">Designer</div>
        <div className="flex-1 min-w-0 hidden md:block">Project</div>
        <div className="w-[100px] hidden lg:block">Customer</div>
        <div className="w-[100px] text-right hidden sm:block">Time Spent</div>
        <div className="w-[90px] text-right">Earnings</div>
        <div className="w-[72px] text-center hidden lg:block">Status</div>
      </div>

      {/* ── Spreadsheet Body ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        {trackers.map((tracker, index) => {
          const isSelected = selectedIds.has(tracker._id);
          const isOvertime = tracker.overTime?.isOverTime;
          return (
            <div
              key={tracker._id}
              onClick={() => router.push(`/designers/${tracker._id}`)}
              className={`flex items-center px-4 h-10 border-b border-border/60 cursor-pointer transition-colors text-[13px] ${
                isSelected
                  ? "bg-primary/[0.06]"
                  : index % 2 === 0
                    ? "bg-background"
                    : "bg-muted/20"
              } hover:bg-primary/[0.04]`}
            >
              {/* Checkbox */}
              <div className="w-9 shrink-0" onClick={(e) => toggleSelect(tracker._id, e)}>
                <div
                  className={`w-4 h-4 rounded border-[1.5px] transition-all flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Designer */}
              <div className="w-[200px] shrink-0 flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                  {tracker.designer[0]}
                </div>
                <span className="text-sm font-medium text-foreground truncate">{tracker.designer}</span>
              </div>

              {/* Project */}
              <div className="flex-1 min-w-0 hidden md:flex items-center gap-2">
                <span className="text-sm text-foreground truncate">
                  {tracker.entryType === "manual" ? tracker.manualProjectName : tracker.projectName}
                </span>
              </div>

              {/* Customer */}
              <div className="w-[100px] hidden lg:block">
                <span className="text-sm text-muted-foreground truncate block">{tracker.customer}</span>
              </div>

              {/* Time */}
              <div className="w-[100px] text-right hidden sm:block">
                <span className="text-sm tabular-nums text-foreground">{formatTime(tracker.totalTimeSpend)}</span>
              </div>

              {/* Earnings */}
              <div className="w-[90px] text-right">
                <span className="text-sm font-medium tabular-nums text-foreground">${tracker.earnings.toFixed(2)}</span>
              </div>

              {/* Status */}
              <div className="w-[72px] hidden lg:flex justify-center">
                {isOvertime ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Over
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    OK
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {!isLoading && trackers.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No data found
          </div>
        )}

        {isLoading && trackers.length === 0 && (
          <PageLoader message="Loading data..." />
        )}

        {isLoading && trackers.length > 0 && (
          <div className="flex justify-center py-3">
            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* ── Status Bar (Excel-style footer) ── */}
      <div className="shrink-0 bg-card border-t border-border px-4 h-9 flex items-center justify-between text-[11px] select-none">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            {trackers.length} rows{hasMore ? "+" : ""}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-foreground font-medium">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Total Time:</span>
              <span className="font-semibold text-foreground tabular-nums">{formatTime(selectedTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Total Earnings:</span>
              <span className="font-semibold text-primary tabular-nums">${selectedEarnings.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
