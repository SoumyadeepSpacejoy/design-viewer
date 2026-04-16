"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import {
  searchAdminTimeTrackers,
  createPersonalTracker,
} from "@/app/clientApi";
import { TimeTracker, AdminTimeTracker } from "@/app/types";
import SearchFilterBar from "./SearchFilterBar";
import AddTrackerModal from "./AddTrackerModal";
import PageLoader from "./PageLoader";

export default function ProjectTracker() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<TimeTracker[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddTrackerModal, setShowAddTrackerModal] = useState(false);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setIsAdmin(role === "admin" || role === "owner");
  }, []);

  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: "100px" });

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
    async (text: string, date: { start: string; end: string }, reset: boolean = false, filterType?: string) => {
      if (isLoading || (!reset && !hasMore)) return;
      const currentSkip = reset ? 0 : skip;
      setIsLoading(true);

      try {
        const result: AdminTimeTracker[] = await searchAdminTimeTrackers(text, date, currentSkip, 10, filterType || undefined);
        const mappedResult: TimeTracker[] = result.map((admin) => ({
          _id: admin._id,
          overTime: admin.overTime,
          totalTimeSpend: admin.totalTimeSpend,
          maximumTimeSeconds: admin.maximumTimeSeconds,
          project: {
            _id: admin._id,
            name: admin.entryType === "manual" ? admin.manualProjectName || admin.projectName : admin.projectName,
            customerName: admin.customer || "Internal",
          },
        }));

        if (reset) {
          setTrackers(mappedResult);
          setSkip(10);
          setHasMore(mappedResult.length === 10);
        } else {
          const existingIds = new Set(trackers.map((t) => t._id));
          const uniqueNewTrackers = mappedResult.filter((t) => !existingIds.has(t._id));
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

  const handleSearchFilter = (text: string, date: { start: string; end: string }, filterType?: string) => {
    setSearchText(text);
    setDateRange(date);
    loadTrackers(text, date, true, filterType);
  };

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    if (inView && hasMore && !isLoading && trackers.length > 0) {
      loadTrackers(searchText, dateRange);
    }
  }, [inView, hasMore, isLoading, loadTrackers, trackers.length, searchText, dateRange]);

  const handleAddPersonalTracker = async () => {
    setIsLoading(true);
    const newTracker = await createPersonalTracker();
    if (newTracker) {
      loadTrackers(searchText, dateRange, true);
    } else {
      setIsLoading(false);
    }
  };

  const hasPersonalTasks = trackers.some((t) => t.project.name === "Personal Tasks");

  const handleTrackerClick = (tracker: TimeTracker) => {
    router.push(`/tracker/${tracker._id}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Project Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and manage your design project timelines</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button onClick={() => setShowAddTrackerModal(true)} className="btn btn-primary btn-sm gap-2 whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
            <button
              onClick={handleAddPersonalTracker}
              disabled={hasPersonalTasks || isLoading}
              className="btn btn-secondary btn-sm gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              title={hasPersonalTasks ? "Personal task already exists" : "Add Personal Task"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              Personal Task
            </button>
          </div>
        </div>

        {/* Search & filters row */}
        <SearchFilterBar onSearch={handleSearchFilter} placeholder="Filter projects..." />
      </div>

      {/* Tracker list */}
      <div className="space-y-3 stagger-items">
        {trackers.map((tracker) => {
          const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
          const isOvertime = timeRemaining < 0;
          const progress = Math.min((tracker.totalTimeSpend / tracker.maximumTimeSeconds) * 100, 100);

          return (
            <div
              key={tracker._id}
              onClick={() => handleTrackerClick(tracker)}
              className="card card-interactive p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isOvertime ? "bg-destructive animate-pulse" : "bg-success"}`} />
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {tracker.project.customerName}&apos;s {tracker.project.name}
                  </h3>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOvertime ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Spent: <span className="font-medium text-foreground">{formatTime(tracker.totalTimeSpend)}</span></span>
                  <span>
                    {isOvertime ? "Over by: " : "Remaining: "}
                    <span className={`font-medium ${isOvertime ? "text-destructive" : "text-foreground"}`}>
                      {formatTime(Math.abs(timeRemaining))}
                    </span>
                  </span>
                </div>

                {tracker.overTime?.isOverTime && tracker.overTime?.reason && (
                  <div className="mt-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10 text-xs">
                    <span className="font-semibold text-destructive">Overtime reason:</span>
                    <p className="text-muted-foreground mt-0.5">{tracker.overTime.reason}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && trackers.length === 0 && (
        <PageLoader message="Loading projects..." />
      )}

      {isLoading && trackers.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !isLoading && (
        <div ref={ref} className="flex justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading more...</p>
        </div>
      )}

      {!hasMore && trackers.length > 0 && (
        <div className="text-center py-8 border-t border-border mt-4">
          <p className="text-sm text-muted-foreground">All projects loaded</p>
        </div>
      )}

      {trackers.length === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your project queue is empty. New projects will appear here once assigned.
          </p>
        </div>
      )}

      <AddTrackerModal
        isOpen={showAddTrackerModal}
        onClose={() => setShowAddTrackerModal(false)}
        onTrackerAdded={() => loadTrackers(searchText, dateRange, true)}
      />
    </div>
  );
}
