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
      console.log("Loading trackers, skip:", currentSkip, "reset:", reset);
      setIsLoading(true);

      try {
        const result: AdminTimeTracker[] = await searchAdminTimeTrackers(
          text,
          date,
          currentSkip,
          10,
        );
        console.log("API response received, trackers count:", result.length);

        // Map AdminTimeTracker to TimeTracker for UI compatibility
        const mappedResult: TimeTracker[] = result.map((admin) => ({
          _id: admin._id,
          overTime: admin.overTime,
          totalTimeSpend: admin.totalTimeSpend,
          maximumTimeSeconds: admin.maximumTimeSeconds,
          project: {
            _id: admin._id, // Using tracker ID as placeholder
            name: admin.projectName,
            customerName: admin.customer,
          },
          // Budget and earnings are in AdminTimeTracker but we will skip showing them in the UI as requested
        }));

        if (reset) {
          setTrackers(mappedResult);
          setSkip(10);
          setHasMore(mappedResult.length === 10);
        } else {
          // Filter duplicates
          const existingIds = new Set(trackers.map((t) => t._id));
          const uniqueNewTrackers = mappedResult.filter(
            (t) => !existingIds.has(t._id),
          );

          console.log("Adding", uniqueNewTrackers.length, "new trackers");
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

  // Initial load
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

  // InView effect for infinite scroll
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

  // Fallback: scroll listener
  useEffect(() => {
    if (!initialLoadComplete.current) return;

    const handleScroll = () => {
      if (hasMore && !isLoading && trackers.length > 0) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 200) {
          loadTrackers(searchText, dateRange);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    hasMore,
    isLoading,
    trackers.length,
    loadTrackers,
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

  // Show detail view if a tracker is selected
  useEffect(() => {
    const hydrateSelectedTracker = async () => {
      // If we have an ID but no object, fetch it (e.g. reload or deep link)
      if (
        activeSubItemId &&
        (!selectedTracker || selectedTracker._id !== activeSubItemId) &&
        hydratingId.current !== activeSubItemId
      ) {
        hydratingId.current = activeSubItemId;
        setIsLoading(true);
        try {
          const tracker = await fetchTimeTracker(activeSubItemId);
          // Check if it's still the ID we care about after the async call
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
        // Reset if ID is cleared
        setSelectedTracker(null);
        hydratingId.current = null;
      }
    };
    hydrateSelectedTracker();
  }, [activeSubItemId, selectedTracker?._id]);

  // If we are currently loading the detail view from URL, show spinner
  if (isLoading && activeSubItemId && !selectedTracker) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-pink-400/40 text-xs font-bold uppercase tracking-[0.2em]">
          Retrieving Project Data...
        </p>
      </div>
    );
  }

  if (selectedTracker) {
    return <TrackerDetail tracker={selectedTracker} onBack={handleBack} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-light text-pink-100 uppercase tracking-tight mb-1">
            My <span className="text-pink-400 font-medium">Projects</span>
          </h2>
          <p className="text-pink-300/30 text-[10px] font-bold uppercase tracking-[0.3em]">
            Manage your design timelines
          </p>
        </div>

        <SearchFilterBar
          onSearch={handleSearchFilter}
          placeholder="Search projects..."
        />
      </div>

      {/* Trackers List */}
      <div className="space-y-4">
        {trackers.map((tracker, index) => {
          const timeRemaining =
            tracker.maximumTimeSeconds - tracker.totalTimeSpend;
          const isOvertime = timeRemaining < 0;

          return (
            <div
              key={tracker._id}
              onClick={() => handleTrackerClick(tracker)}
              className="group glass-panel rounded-2xl border border-pink-500/10 p-6 hover:border-pink-500/30 transition-all duration-300 cursor-pointer animate-fade-in-scale"
              style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-light text-pink-100 mb-3 truncate">
                    {tracker.project.customerName}'s {tracker.project.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Time Spent */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-pink-300/40 text-xs uppercase tracking-wider">
                          Time Spent
                        </p>
                        <p className="text-blue-400 font-medium">
                          {formatTime(tracker.totalTimeSpend)}
                        </p>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`p-1.5 rounded-lg border ${isOvertime ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}
                      >
                        <svg
                          className={`w-4 h-4 ${isOvertime ? "text-red-400" : "text-green-400"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-pink-300/40 text-xs uppercase tracking-wider">
                          {isOvertime ? "Overtime" : "Remaining"}
                        </p>
                        <p
                          className={`font-medium ${isOvertime ? "text-red-400" : "text-green-400"}`}
                        >
                          {isOvertime
                            ? formatTime(Math.abs(timeRemaining))
                            : formatTime(timeRemaining)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Overtime Warning */}
                  {tracker.overTime?.isOverTime && tracker.overTime?.reason && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Overtime Reason
                      </p>
                      <p className="text-pink-100/80 text-[11px] leading-relaxed italic">
                        "{tracker.overTime.reason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-pink-400/60 group-hover:text-pink-400 group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin shadow-[0_0_15px_rgba(236,72,153,0.3)]"></div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {!isLoading && hasMore && (
        <div
          ref={ref}
          className="flex justify-center mt-8 py-4"
          style={{ minHeight: "100px" }}
        >
          <div className="text-pink-300/40 text-sm font-light">
            Scroll for more projects...
          </div>
        </div>
      )}

      {/* No More Projects */}
      {!hasMore && trackers.length > 0 && (
        <div className="text-center mt-8">
          <p className="text-pink-300/40 text-sm font-light">
            All {trackers.length} projects loaded
          </p>
        </div>
      )}

      {/* Empty State */}
      {trackers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 p-4 bg-black/60 rounded-[2rem] border border-pink-500/10">
            <svg
              className="w-full h-full text-pink-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-xl font-light text-pink-100 mb-4">
            No Projects Found
          </h3>
          <p className="text-pink-300/60 font-light text-sm max-w-md mx-auto">
            There are no active projects at the moment. Check back later for new
            assignments.
          </p>
        </div>
      )}
    </div>
  );
}
