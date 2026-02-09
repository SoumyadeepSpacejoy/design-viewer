"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AdminTimeTracker } from "@/app/types";
import { searchAdminTimeTrackers } from "@/app/clientApi";
import SearchFilterBar from "./SearchFilterBar";

interface DesignerTrackerDashboardProps {
  onSelect?: (id: string | null, name?: string) => void;
}

export default function DesignerTrackerDashboard({
  onSelect,
}: DesignerTrackerDashboardProps) {
  const [trackers, setTrackers] = useState<AdminTimeTracker[]>([]);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const loadTrackers = useCallback(
    async (
      text: string,
      date: { start: string; end: string },
      reset: boolean = false,
    ) => {
      setIsLoading(true);
      try {
        const currentSkip = reset ? 0 : skip;
        const data = await searchAdminTimeTrackers(
          text,
          date,
          currentSkip,
          limit,
        );
        if (reset) {
          setTrackers(data);
          setSkip(limit);
        } else {
          setTrackers((prev) => [...prev, ...data]);
          setSkip(currentSkip + limit);
        }
      } catch (error) {
        console.error("Error loading trackers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [skip, limit],
  );

  useEffect(() => {
    if (hasLoadedInitial.current) return;
    hasLoadedInitial.current = true;
    loadTrackers("", { start: "", end: "" }, true);
  }, [loadTrackers]);

  const handleSearchFilter = (
    text: string,
    date: { start: string; end: string },
  ) => {
    setSearchText(text);
    setDateRange(date);
    loadTrackers(text, date, true);
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

  const selectedEarnings = trackers
    .filter((t) => selectedIds.has(t._id))
    .reduce((sum, t) => sum + t.earnings, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-scale">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-1">
            Designer <span className="text-primary font-bold">Ledger</span>
          </h2>
          <p className="text-muted-foreground/50 text-[10px] font-bold uppercase tracking-[0.3em]">
            SYSTEM WIDE PERFORMANCE ANALYTICS
          </p>
        </div>

        <SearchFilterBar
          onSearch={handleSearchFilter}
          placeholder="Search designers or projects..."
        />
      </div>

      <div className="flex-1 glass-panel rounded-2xl border border-border overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="bg-primary/5 border-b border-border flex items-center px-6 py-4 text-[10px] font-black text-primary/60 uppercase tracking-widest">
          <div className="w-10">
            <button
              onClick={toggleSelectAll}
              className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                selectedIds.size === trackers.length && trackers.length > 0
                  ? "bg-primary border-primary"
                  : "border-primary/30 hover:border-primary"
              }`}
            >
              {selectedIds.size === trackers.length && trackers.length > 0 && (
                <svg
                  className="w-3 h-3 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-1 lg:max-w-[200px]">Designer</div>
          <div className="flex-1 hidden md:block pl-6">Project Scope</div>
          <div className="w-32 hidden sm:block text-right">Time Spent</div>
          <div className="w-32 text-right">Earnings</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
          {trackers.map((tracker) => {
            const isSelected = selectedIds.has(tracker._id);
            return (
              <div
                key={tracker._id}
                onClick={() =>
                  onSelect?.(
                    String(tracker._id),
                    `${tracker.designer}: ${tracker.projectName}`,
                  )
                }
                className={`group flex items-center px-6 py-4 border-b border-white/5 hover:bg-primary/[0.02] transition-colors cursor-pointer ${
                  isSelected ? "bg-primary/[0.05]" : ""
                }`}
              >
                <div
                  className="w-10"
                  onClick={(e) => toggleSelect(tracker._id, e)}
                >
                  <div
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary/30"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-black"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex-1 lg:max-w-[200px] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {tracker.designer[0]}
                  </div>
                  <div className="truncate">
                    <p className="text-foreground text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {tracker.designer}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest md:hidden">
                      {tracker.customer}
                    </p>
                  </div>
                </div>

                <div className="flex-1 hidden md:block border-l border-white/5 pl-6">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground text-sm font-medium truncate">
                      {tracker.projectName}
                    </p>
                    {tracker.overTime?.isOverTime && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-[8px] font-black text-red-400 uppercase tracking-tighter">
                        Overtime
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    {tracker.customer}
                  </p>
                </div>

                <div className="w-32 hidden sm:block text-right tabular-nums">
                  <p className="text-foreground text-sm font-bold">
                    {formatTime(tracker.totalTimeSpend)}
                  </p>
                </div>

                <div className="w-32 text-right">
                  <p
                    className={`text-sm font-bold tabular-nums ${isSelected ? "text-primary" : "text-primary/80"}`}
                  >
                    ${tracker.earnings.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}

          {!isLoading && trackers.length === 0 && (
            <div className="py-20 text-center opacity-30 text-xs uppercase tracking-widest">
              No performance data found
            </div>
          )}

          {isLoading && trackers.length === 0 && (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Excel Footer / Status Bar */}
        <div className="bg-muted/90 border-t border-border px-6 py-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-primary/40">Rows Selected:</span>
              <span className="text-primary font-bold">{selectedIds.size}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-primary/40">Aggregation Sum:</span>
              <span className="text-background bg-primary px-2 py-1 rounded shadow-[0_0_15px_rgba(236,72,153,0.3)] text-xs font-black">
                ${selectedEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
