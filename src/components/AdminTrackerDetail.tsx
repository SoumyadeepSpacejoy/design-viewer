"use client";

import { useEffect, useState, useRef } from "react";
import {
  AdminTimeTracker,
  TimeTrackerState,
  TimeTrackerSession,
} from "@/app/types";
import {
  fetchTimeTrackerStates,
  fetchTimeTracker,
  fetchTaskSessions,
  searchAdminTimeTrackers,
} from "@/app/clientApi";

interface AdminTrackerDetailProps {
  trackerId: string;
}

export default function AdminTrackerDetail({
  trackerId,
}: AdminTrackerDetailProps) {
  const [tracker, setTracker] = useState<AdminTimeTracker | null>(null);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [sessions, setSessions] = useState<
    Record<string, TimeTrackerSession[]>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedId = useRef<string | null>(null);
  const pendingFetches = useRef<Set<string>>(new Set());

  const loadData = async () => {
    if (lastLoadedId.current === trackerId) return;
    lastLoadedId.current = trackerId;

    setIsLoading(true);
    try {
      // 1. Fetch basic tracker info first (always available if user has access)
      const standardTracker = await fetchTimeTracker(trackerId);

      // 2. Fetch tasks (always available)
      const tasksData = await fetchTimeTrackerStates(trackerId);
      setTasks(tasksData);

      if (standardTracker) {
        // Try to enrich with extra admin search data if possible, but don't fail if it crashes
        let enrichedData: AdminTimeTracker | null = null;
        try {
          const trackers = await searchAdminTimeTrackers(trackerId, {
            start: "",
            end: "",
          });
          enrichedData = trackers.find((t) => t._id === trackerId) || null;
        } catch (searchErr) {
          // Soft failure is acceptable - admin search is optional enrichment
        }

        // Combine data, prioritizing enriched search data if found
        setTracker({
          ...standardTracker,
          projectName:
            enrichedData?.projectName || standardTracker.project.name,
          customer:
            enrichedData?.customer || standardTracker.project.customerName,
          designer: enrichedData?.designer || "N/A",
          hourlyRate:
            enrichedData?.hourlyRate ?? standardTracker.hourlyRate ?? 0,
          earnings: enrichedData?.earnings ?? standardTracker.earnings ?? 0,
          budget: enrichedData?.budget ?? standardTracker.budget ?? 0,
        } as AdminTimeTracker);
      }
    } catch (error) {
      console.error("Error loading admin tracker detail:", error);
      lastLoadedId.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async (taskId: string) => {
    if (pendingFetches.current.has(`sessions-${taskId}`)) return;
    pendingFetches.current.add(`sessions-${taskId}`);

    setLoadingSessions((prev) => new Set(prev).add(taskId));
    try {
      const data = await fetchTaskSessions(taskId);
      setSessions((prev) => ({ ...prev, [taskId]: data }));
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoadingSessions((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      pendingFetches.current.delete(`sessions-${taskId}`);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
      if (!sessions[taskId]) {
        loadSessions(taskId);
      }
    }
    setExpandedTasks(next);
  };

  useEffect(() => {
    loadData();
  }, [trackerId]);

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && !tracker) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="text-center py-20 glass-panel rounded-3xl border border-pink-500/10 max-w-2xl mx-auto">
        <p className="text-pink-300/40 uppercase tracking-widest text-sm">
          Tracker not found.
        </p>
      </div>
    );
  }

  const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
  const isOvertime = timeRemaining < 0;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-scale px-4">
      {/* Header Info Card */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-pink-500/40 hover:text-pink-400 transition-colors group"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Back to Dashboard
            </span>
          </button>

          <button
            onClick={() => {
              lastLoadedId.current = null;
              loadData();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 text-pink-500/40 hover:text-pink-400 transition-colors group px-4 py-2 bg-pink-500/5 hover:bg-pink-500/10 rounded-xl border border-pink-500/10 transition-all"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-shadow-sm">
              {isLoading ? "Syncing..." : "Sync Latest Data"}
            </span>
          </button>
        </div>

        <div className="glass-panel rounded-[2rem] border border-pink-500/10 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-pink-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
                  Designer Project Tracking
                </p>
                <h1 className="text-3xl sm:text-4xl font-thin text-pink-100 uppercase tracking-tight text-pink-shadow">
                  {tracker.customer}'s{" "}
                  <span className="text-pink-400 font-light">
                    {tracker.projectName}
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-pink-300/40 text-[10px] uppercase tracking-widest">
                    Hourly Rate
                  </p>
                  <p className="text-pink-100 font-light text-xl">
                    ${tracker.hourlyRate || 0}/h
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-pink-300/40 text-[10px] uppercase tracking-widest">
                    Total Budget
                  </p>
                  <p className="text-pink-100 font-light text-xl">
                    {tracker.budget !== undefined && tracker.budget !== null
                      ? `$${tracker.budget}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-black/40 rounded-2xl border border-pink-500/5 p-6 hover:border-pink-500/20 transition-all">
                <p className="text-pink-300/40 text-xs uppercase tracking-widest mb-2 font-bold">
                  Total Time
                </p>
                <p className="text-blue-400 font-light text-2xl tabular-nums">
                  {formatTime(tracker.totalTimeSpend)}
                </p>
              </div>

              <div className="bg-black/40 rounded-2xl border border-pink-500/5 p-6 hover:border-pink-500/20 transition-all">
                <p className="text-pink-300/40 text-xs uppercase tracking-widest mb-2 font-bold">
                  {isOvertime ? "Overtime" : "Remaining"}
                </p>
                <p
                  className={`font-light text-2xl tabular-nums ${isOvertime ? "text-red-400" : "text-green-400"}`}
                >
                  {formatTime(Math.abs(timeRemaining))}
                </p>
                {tracker.overTime?.reason && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl shadow-lg shadow-black/20 transition-all hover:border-red-500/40">
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
                    <p className="text-pink-100 text-xs leading-relaxed font-medium italic">
                      "{tracker.overTime.reason}"
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-black/40 rounded-2xl border border-pink-500/5 p-6 hover:border-pink-500/20 transition-all">
                <p className="text-pink-300/40 text-xs uppercase tracking-widest mb-2 font-bold">
                  Max Limit
                </p>
                <p className="text-pink-400/60 font-light text-2xl tabular-nums">
                  {formatTime(tracker.maximumTimeSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-thin text-pink-100 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span className="w-8 h-px bg-pink-500/30" />
          Detailed Task Logs
          <span className="w-8 h-px bg-pink-500/30" />
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => {
              const isExpanded = expandedTasks.has(task._id);
              const taskSessions = sessions[task._id] || [];
              const isLoadingTaskSessions = loadingSessions.has(task._id);

              return (
                <div
                  key={task._id}
                  className="glass-panel rounded-2xl border border-pink-500/10 hover:border-pink-500/30 transition-all group overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg text-[10px] font-bold text-pink-300 uppercase tracking-widest">
                            {task.tag}
                          </span>
                          {task.status === "inProgress" && (
                            <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[9px] text-green-400 font-bold uppercase tracking-tighter animate-pulse">
                              Currently Active
                            </span>
                          )}
                          {(task.status === "paused" ||
                            task.status === "pause") && (
                            <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] text-yellow-500 font-bold uppercase tracking-tighter">
                              Paused
                            </span>
                          )}
                          {(task.status === "completed" ||
                            task.status === "done") && (
                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/40 font-bold uppercase tracking-tighter">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-pink-300/40 text-[10px] uppercase tracking-wider mb-1 font-bold">
                              Total Performance
                            </p>
                            <p className="text-pink-100 font-medium tabular-nums">
                              {formatTime(task.totalDuration)}
                            </p>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => toggleTaskExpansion(task._id)}
                              className="text-[10px] font-black uppercase tracking-widest text-pink-500/40 hover:text-pink-400 transition-colors flex items-center gap-1.5"
                            >
                              {isExpanded ? "Hide Logs" : "View Logs"}
                              <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {task.note && (
                          <div className="mt-6 p-5 bg-black/40 rounded-2xl border border-pink-500/5 group-hover:border-pink-500/10 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                className="w-3.5 h-3.5 text-pink-500/40"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span className="text-[10px] font-bold text-pink-500/40 uppercase tracking-widest">
                                Task Note
                              </span>
                            </div>
                            <p className="text-pink-300/70 text-sm leading-relaxed whitespace-pre-wrap font-light">
                              {task.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sessions Section */}
                  {isExpanded && (
                    <div className="bg-black/20 border-t border-pink-500/10 px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-3 bg-pink-500 rounded-full"></div>
                        <h4 className="text-[10px] font-black text-pink-500/60 uppercase tracking-widest">
                          Working Intervals
                        </h4>
                      </div>

                      {isLoadingTaskSessions ? (
                        <div className="py-4 flex justify-center">
                          <div className="w-5 h-5 border-2 border-pink-500/10 border-t-pink-500 rounded-full animate-spin"></div>
                        </div>
                      ) : taskSessions.length > 0 ? (
                        <div className="space-y-2">
                          {taskSessions.map((session) => (
                            <div
                              key={session._id}
                              className="flex items-center justify-between text-[11px] py-2 border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-pink-300/60 w-32">
                                  {formatDateTime(session.startTime)}
                                </span>
                                <span className="text-pink-500/20">→</span>
                                <span className="text-pink-300/60 w-32">
                                  {session.endTime ? (
                                    formatDateTime(session.endTime)
                                  ) : (
                                    <span className="text-green-500/60 animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="text-pink-400 tabular-nums font-medium">
                                {formatTime(session.duration)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-pink-300/20 uppercase tracking-widest text-center py-2">
                          No recorded intervals found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass-panel rounded-3xl border border-pink-500/10 border-dashed">
            <p className="text-pink-300/40 uppercase tracking-widest text-sm font-bold">
              No tasks recorded for this project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
