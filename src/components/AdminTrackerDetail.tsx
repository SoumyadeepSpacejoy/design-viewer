"use client";

import { useEffect, useState, useRef } from "react";
import { AdminTimeTracker, TimeTrackerState } from "@/app/types";
import { fetchTimeTrackerStates, fetchTimeTracker } from "@/app/clientApi";

interface AdminTrackerDetailProps {
  trackerId: string;
}

export default function AdminTrackerDetail({
  trackerId,
}: AdminTrackerDetailProps) {
  const [tracker, setTracker] = useState<AdminTimeTracker | null>(null);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedId = useRef<string | null>(null);

  const loadData = async () => {
    if (lastLoadedId.current === trackerId) return;
    lastLoadedId.current = trackerId;

    setIsLoading(true);
    try {
      const [trackerData, tasksData] = await Promise.all([
        fetchTimeTracker(trackerId),
        fetchTimeTrackerStates(trackerId),
      ]);

      // The API returns standard TimeTracker, but for admin we can treat it as AdminTimeTracker
      // if we have the extra fields. However, fetchTimeTracker returns standard TimeTracker.
      // For simplicity, we'll use the fields available.
      setTracker(trackerData as AdminTimeTracker);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading admin tracker detail:", error);
      lastLoadedId.current = null; // Reset on error to allow retry
    } finally {
      setIsLoading(false);
    }
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
        <div className="glass-panel rounded-[2rem] border border-pink-500/10 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-pink-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
                  Designer Project Tracking
                </p>
                <h1 className="text-3xl sm:text-4xl font-thin text-pink-100 uppercase tracking-tight text-pink-shadow">
                  {tracker.project.customerName}'s{" "}
                  <span className="text-pink-400 font-light">
                    {tracker.project.name}
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-pink-300/40 text-[10px] uppercase tracking-widest">
                    Target Budget
                  </p>
                  <p className="text-pink-100 font-light text-xl">
                    ${tracker.budget || "N/A"}
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
            {tasks.map((task) => (
              <div
                key={task._id}
                className="glass-panel rounded-2xl border border-pink-500/10 p-6 hover:border-pink-500/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg text-[10px] font-bold text-pink-300 uppercase tracking-widest">
                        {task.tag}
                      </span>
                      {!task.endTime && (
                        <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[9px] text-green-400 font-bold uppercase tracking-tighter animate-pulse">
                          Currently Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-pink-300/40 text-[10px] uppercase tracking-wider mb-1 font-bold">
                          Start Time
                        </p>
                        <p className="text-pink-100 text-sm font-light">
                          {formatDateTime(task.startTime)}
                        </p>
                      </div>
                      {task.endTime && (
                        <div>
                          <p className="text-pink-300/40 text-[10px] uppercase tracking-wider mb-1 font-bold">
                            End Time
                          </p>
                          <p className="text-pink-100 text-sm font-light">
                            {formatDateTime(task.endTime)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-pink-300/40 text-[10px] uppercase tracking-wider mb-1 font-bold">
                          Duration
                        </p>
                        <p className="text-pink-400 font-medium tabular-nums">
                          {formatTime(task.duration)}
                        </p>
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
            ))}
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
