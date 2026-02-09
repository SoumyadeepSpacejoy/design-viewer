"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { fetchTimeTracker, searchAdminTimeTrackers } from "@/app/clientApi";
import { TimeTracker, AdminTimeTracker } from "@/app/types";
import TrackerDetail from "./TrackerDetail";
import SearchFilterBar from "./SearchFilterBar";

interface ProjectTrackerProps {
  onSubItemSelect?: (id: string | null, name?: string) => void;
  activeSubItemId?: string;
}

export default function ProjectTracker({
  onSubItemSelect,
  activeSubItemId,
}: ProjectTrackerProps = {}) {
  const [trackers, setTrackers] = useState<TimeTracker[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedTracker, setSelectedTracker] = useState<TimeTracker | null>(
    null,
  );
  const initialLoadComplete = useRef(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

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
      if (isLoading || (!reset && !hasMore)) return;

      const currentSkip = reset ? 0 : skip;
      setIsLoading(true);

      try {
        const result: AdminTimeTracker[] = await searchAdminTimeTrackers(
          text,
          date,
          currentSkip,
          10,
        );

        const mappedResult: TimeTracker[] = result.map((admin) => ({
          _id: admin._id,
          overTime: admin.overTime,
          totalTimeSpend: admin.totalTimeSpend,
          maximumTimeSeconds: admin.maximumTimeSeconds,
          project: {
            _id: admin._id,
            name: admin.projectName,
            customerName: admin.customer,
          },
        }));

        if (reset) {
          setTrackers(mappedResult);
          setSkip(10);
          setHasMore(mappedResult.length === 10);
        } else {
          const existingIds = new Set(trackers.map((t) => t._id));
          const uniqueNewTrackers = mappedResult.filter(
            (t) => !existingIds.has(t._id),
          );

          setTrackers((prev) => [...prev, ...uniqueNewTrackers]);
          setSkip(currentSkip + 10);
          setHasMore(mappedResult.length === 10);
        }
      } catch (error) {
        console.error("Error loading trackers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, skip, trackers],
  );

  useEffect(() => {
    if (initialLoadComplete.current) return;
    initialLoadComplete.current = true;
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

  useEffect(() => {
    if (!initialLoadComplete.current) return;

    if (inView && hasMore && !isLoading && trackers.length > 0) {
      loadTrackers(searchText, dateRange);
    }
  }, [
    inView,
    hasMore,
    isLoading,
    loadTrackers,
    trackers.length,
    searchText,
    dateRange,
  ]);

  const handleTrackerClick = (tracker: TimeTracker) => {
    setSelectedTracker(tracker);
    onSubItemSelect?.(
      tracker._id,
      `${tracker.project.customerName}'s ${tracker.project.name}`,
    );
  };

  const handleBack = () => {
    setSelectedTracker(null);
    onSubItemSelect?.(null);
  };

  const hydratingId = useRef<string | null>(null);

  useEffect(() => {
    const hydrateSelectedTracker = async () => {
      if (
        activeSubItemId &&
        (!selectedTracker || selectedTracker._id !== activeSubItemId) &&
        hydratingId.current !== activeSubItemId
      ) {
        hydratingId.current = activeSubItemId;
        setIsLoading(true);
        try {
          const tracker = await fetchTimeTracker(activeSubItemId);
          if (tracker && hydratingId.current === activeSubItemId) {
            setSelectedTracker(tracker);
          }
        } catch (error) {
          console.error("Hydration failed:", error);
        } finally {
          setIsLoading(false);
          if (hydratingId.current === activeSubItemId) {
            hydratingId.current = null;
          }
        }
      } else if (!activeSubItemId) {
        setSelectedTracker(null);
        hydratingId.current = null;
      }
    };
    hydrateSelectedTracker();
  }, [activeSubItemId, selectedTracker?._id]);

  if (isLoading && activeSubItemId && !selectedTracker) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">
          Accessing Project Records...
        </p>
      </div>
    );
  }

  if (selectedTracker) {
    return <TrackerDetail tracker={selectedTracker} onBack={handleBack} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-3 text-foreground">
            Active <span className="text-primary font-bold">Timeline</span>
          </h2>
          <p className="text-muted-foreground font-medium text-sm">
            Monitor and manage your design project phases in real-time.
          </p>
        </div>

        <div className="w-full md:w-auto">
          <SearchFilterBar
            onSearch={handleSearchFilter}
            placeholder="Filter projects..."
          />
        </div>
      </div>

      {/* Trackers List */}
      <div className="grid grid-cols-1 gap-6 stagger-items">
        {trackers.map((tracker) => {
          const timeRemaining =
            tracker.maximumTimeSeconds - tracker.totalTimeSpend;
          const isOvertime = timeRemaining < 0;

          return (
            <div
              key={tracker._id}
              onClick={() => handleTrackerClick(tracker)}
              className="premium-card group p-8 sm:p-10 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-8"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-2 h-2 rounded-full ${isOvertime ? "bg-destructive animate-pulse" : "bg-primary"}`}
                  ></div>
                  <h3 className="text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {tracker.project.customerName}'s {tracker.project.name}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2.5">
                    <span className="text-foreground/40">Utilization</span>
                    <span className="text-foreground">
                      {formatTime(tracker.totalTimeSpend)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-foreground/40">
                      {isOvertime ? "Deficit" : "Allowance"}
                    </span>
                    <span
                      className={
                        isOvertime ? "text-destructive" : "text-primary"
                      }
                    >
                      {isOvertime
                        ? formatTime(Math.abs(timeRemaining))
                        : formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>

                {tracker.overTime?.isOverTime && tracker.overTime?.reason && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-2xl border border-border/50 text-[11px]">
                    <span className="text-destructive font-black uppercase tracking-[0.2em] block mb-2">
                      Anomalous Activity Flagged
                    </span>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{tracker.overTime.reason}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block w-px h-12 bg-border"></div>
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110 shadow-inner">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}

      {hasMore && !isLoading && (
        <div ref={ref} className="flex justify-center py-24">
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-muted-foreground/40 animate-pulse">
            Pulling Additional Data
          </p>
        </div>
      )}

      {!hasMore && trackers.length > 0 && (
        <div className="text-center py-24 border-t border-border/10 mt-12">
          <p className="text-[10px] uppercase font-bold tracking-[0.5em] opacity-30">
            All Records Synchronized
          </p>
        </div>
      )}

      {trackers.length === 0 && !isLoading && (
        <div className="text-center py-32 premium-card p-12">
          <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/30"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-foreground mb-4 tracking-tight">
            No Project Records
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            Your current assignment queue is empty. New project links will
            appear here once allocated.
          </p>
        </div>
      )}
    </div>
  );
}
