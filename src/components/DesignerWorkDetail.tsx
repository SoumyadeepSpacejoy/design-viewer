"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DesignerWorkTracker } from "@/app/types";
import { fetchDesignerWork } from "@/app/clientApi";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

interface Props {
  designerId: string;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts: string[] = [];
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
    case "daily":
      end.setHours(23, 59, 59, 999);
      break;
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

export default function DesignerWorkDetail({ designerId }: Props) {
  const [trackers, setTrackers] = useState<DesignerWorkTracker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const data = await fetchDesignerWork(designerId, start, end);
      setTrackers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [designerId]);

  useEffect(() => {
    load("", "");
  }, [load]);

  const handleRangeClick = (range: string) => {
    const isDeactivating = activeRange === range;
    const newRange = isDeactivating ? null : range;
    setActiveRange(newRange);
    let newDates = { start: "", end: "" };
    if (newRange) newDates = calculateRange(newRange);
    setStartDate(newDates.start);
    setEndDate(newDates.end);
    load(newDates.start, newDates.end);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    load("", "");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = useMemo(() => {
    const time = trackers.reduce((sum, t) => sum + (t.timeWorked || 0), 0);
    const earnings = trackers.reduce((sum, t) => sum + (t.earnings || 0), 0);
    return { time, earnings };
  }, [trackers]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Designer Work Breakdown</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Filter by date range to see time and earnings per project for this designer.
        </p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Period:</span>
        {["daily", "weekly", "monthly", "yearly"].map((range) => (
          <button
            key={range}
            onClick={() => handleRangeClick(range)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeRange === range
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {range}
          </button>
        ))}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setActiveRange(null);
            if (s && e) load(s, e);
            else if (!s && !e) load("", "");
          }}
        />
        {(startDate || endDate || activeRange) && (
          <button onClick={handleReset} className="btn btn-ghost btn-sm text-xs ml-auto">
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Total Time</p>
          <p className="text-xl font-semibold text-foreground tabular-nums mt-1">
            {formatTime(totals.time)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Total Earnings</p>
          <p className="text-xl font-semibold text-primary tabular-nums mt-1">
            ${totals.earnings.toFixed(2)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Loading work..." />
      ) : trackers.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No work in this period.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trackers.map((tracker) => {
            const isOpen = expanded.has(tracker._id);
            return (
              <div key={tracker._id} className="card overflow-hidden">
                <button
                  onClick={() => toggleExpand(tracker._id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {tracker.projectName || "Untitled project"}
                    </p>
                    {tracker.customer && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tracker.customer}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatTime(tracker.timeWorked)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tracker.tasks.length} {tracker.tasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <p className="text-sm font-semibold tabular-nums text-primary">
                      ${tracker.earnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${tracker.hourlyRate}/hr
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20">
                    {tracker.tasks.length === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground">No tasks.</p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {tracker.tasks.map((task) => (
                          <div key={task._id} className="px-4 py-3 flex items-center gap-3 text-xs">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {task.tag || "Untitled task"}
                              </p>
                              {task.note && (
                                <p className="text-muted-foreground truncate mt-0.5">
                                  {task.note}
                                </p>
                              )}
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(task.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="tabular-nums text-foreground shrink-0">
                              {formatTime(task.totalDuration)}
                            </span>
                            <span className="tabular-nums text-primary shrink-0 w-20 text-right">
                              ${((task.totalDuration / 3600) * tracker.hourlyRate).toFixed(2)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                              task.status === "done"
                                ? "bg-success/10 text-success"
                                : task.status === "inProgress"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
