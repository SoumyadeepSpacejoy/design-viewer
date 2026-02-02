"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { fetchTimeTrackers, fetchTimeTracker } from "@/app/clientApi";
import { TimeTracker } from "@/app/types";
import TrackerDetail from "./TrackerDetail";

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

  const loadMoreTrackers = useCallback(async () => {
    if (isLoading || !hasMore) {
      console.log("Skipping load - isLoading:", isLoading, "hasMore:", hasMore);
      return;
    }

    console.log("Loading more trackers, skip:", skip);
    setIsLoading(true);

    try {
      const result = await fetchTimeTrackers(skip, 20);
      console.log("API response received, trackers count:", result.length);

      if (result.length === 0) {
        setHasMore(false);
        setIsLoading(false);
      } else {
        // Filter duplicates
        const existingIds = new Set(trackers.map((t) => t._id));
        const uniqueNewTrackers = result.filter((t) => !existingIds.has(t._id));

        console.log("Adding", uniqueNewTrackers.length, "new trackers");

        const newTrackers = [...trackers, ...uniqueNewTrackers];
        const newSkip = skip + 20;

        setTrackers(newTrackers);
        setSkip(newSkip);

        // If we got less than 20, there's no more data
        if (result.length < 20) {
          setHasMore(false);
        }

        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading trackers:", error);
      setIsLoading(false);
    }
  }, [isLoading, hasMore, skip, trackers]);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      if (initialLoadComplete.current) {
        console.log("Initial load already completed, skipping");
        return;
      }

      console.log("Initial load triggered");
      initialLoadComplete.current = true;
      setIsLoading(true);

      try {
        const result = await fetchTimeTrackers(0, 20);
        console.log(
          "Initial API response received, trackers count:",
          result.length,
        );

        setTrackers(result);
        setSkip(20);
        setHasMore(result.length === 20);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading initial trackers:", error);
        setIsLoading(false);
      }
    };

    initialLoad();
  }, []);

  // InView effect for infinite scroll
  useEffect(() => {
    if (!initialLoadComplete.current) {
      console.log("Initial load not complete, skipping InView trigger");
      return;
    }

    console.log(
      "InView changed:",
      inView,
      "hasMore:",
      hasMore,
      "isLoading:",
      isLoading,
      "trackers:",
      trackers.length,
    );
    if (inView && hasMore && !isLoading && trackers.length > 0) {
      loadMoreTrackers();
    }
  }, [inView, hasMore, isLoading, loadMoreTrackers, trackers.length]);

  // Fallback: scroll listener
  useEffect(() => {
    if (!initialLoadComplete.current) {
      return;
    }

    const handleScroll = () => {
      if (hasMore && !isLoading && trackers.length > 0) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 200) {
          console.log("Scroll fallback triggered");
          loadMoreTrackers();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, trackers.length, loadMoreTrackers]);

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
    <div className="max-w-6xl mx-auto">
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
