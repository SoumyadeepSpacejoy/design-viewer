"use client";

import { useEffect, useState, useRef } from "react";
import { AdminTimeTracker, TimeTrackerState, TimeTrackerSession } from "@/app/types";
import { fetchTimeTrackerStates, fetchTimeTracker, fetchTaskSessions, searchAdminTimeTrackers, updateTaskTime } from "@/app/clientApi";
import UpdateTaskTimeModal from "./UpdateTaskTimeModal";
import PageLoader from "./PageLoader";

interface AdminTrackerDetailProps {
  trackerId: string;
}

export default function AdminTrackerDetail({ trackerId }: AdminTrackerDetailProps) {
  const [tracker, setTracker] = useState<AdminTimeTracker | null>(null);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [sessions, setSessions] = useState<Record<string, TimeTrackerSession[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedId = useRef<string | null>(null);
  const pendingFetches = useRef<Set<string>>(new Set());
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [activeTaskForUpdate, setActiveTaskForUpdate] = useState<TimeTrackerState | null>(null);

  const loadData = async () => {
    if (lastLoadedId.current === trackerId) return;
    lastLoadedId.current = trackerId;
    setIsLoading(true);
    try {
      const standardTracker = await fetchTimeTracker(trackerId);
      const tasksData = await fetchTimeTrackerStates(trackerId);
      setTasks(tasksData);

      if (standardTracker) {
        let enrichedData: AdminTimeTracker | null = null;
        try {
          const trackers = await searchAdminTimeTrackers(trackerId, { start: "", end: "" });
          enrichedData = trackers.find((t) => t._id === trackerId) || null;
        } catch {}

        setTracker({
          ...standardTracker,
          projectName: enrichedData?.entryType === "manual" ? enrichedData?.manualProjectName || standardTracker.project.name : enrichedData?.projectName || standardTracker.project.name,
          customer: enrichedData?.customer || standardTracker.project.customerName || "Internal",
          designer: enrichedData?.designer || "",
          hourlyRate: enrichedData?.hourlyRate ?? standardTracker.hourlyRate ?? 0,
          earnings: enrichedData?.earnings ?? standardTracker.earnings ?? 0,
          budget: enrichedData?.budget ?? standardTracker.budget ?? 0,
        } as AdminTimeTracker);
      }
    } catch (error) { console.error("Error loading admin tracker detail:", error); lastLoadedId.current = null; }
    finally { setIsLoading(false); }
  };

  const loadSessions = async (taskId: string) => {
    if (pendingFetches.current.has(`sessions-${taskId}`)) return;
    pendingFetches.current.add(`sessions-${taskId}`);
    setLoadingSessions((prev) => new Set(prev).add(taskId));
    try {
      const data = await fetchTaskSessions(taskId);
      setSessions((prev) => ({ ...prev, [taskId]: data }));
    } catch (error) { console.error("Error loading sessions:", error); }
    finally {
      setLoadingSessions((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      pendingFetches.current.delete(`sessions-${taskId}`);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) { next.delete(taskId); } else { next.add(taskId); if (!sessions[taskId]) loadSessions(taskId); }
    setExpandedTasks(next);
  };

  const handleUpdateTaskTime = async (totalSeconds: number) => {
    if (!activeTaskForUpdate) return;
    const taskId = activeTaskForUpdate._id;
    setUpdatingTasks((prev) => new Set(prev).add(taskId));
    try {
      await updateTaskTime(taskId, totalSeconds);
      lastLoadedId.current = null;
      await loadData();
      setActiveTaskForUpdate(null);
    } catch (error) { console.error("Failed to update task time:", error); window.alert("Failed to update task time."); }
    finally { setUpdatingTasks((prev) => { const next = new Set(prev); next.delete(taskId); return next; }); }
  };

  useEffect(() => { loadData(); }, [trackerId]);

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
    return new Date(dateString).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading && !tracker) {
    return <PageLoader message="Loading tracker..." />;
  }

  if (!tracker) {
    return (
      <div className="card py-12 text-center">
        <p className="text-sm text-muted-foreground">Tracker not found.</p>
      </div>
    );
  }

  const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
  const isOvertime = timeRemaining < 0;
  const progress = Math.min((tracker.totalTimeSpend / tracker.maximumTimeSeconds) * 100, 100);

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {tracker.customer}&apos;s {tracker.projectName}
          </h1>
          <button
            onClick={() => { lastLoadedId.current = null; loadData(); }}
            disabled={isLoading}
            className="btn btn-ghost btn-sm btn-icon shrink-0"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {tracker.designer && (
          <p className="text-sm text-muted-foreground">by {tracker.designer}</p>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Time Spent</p>
          <p className="text-xl font-semibold text-foreground tabular-nums">{formatTime(tracker.totalTimeSpend)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{isOvertime ? "Overtime" : "Remaining"}</p>
          <p className={`text-xl font-semibold tabular-nums ${isOvertime ? "text-destructive" : "text-success"}`}>
            {formatTime(Math.abs(timeRemaining))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Budget</p>
          <p className="text-xl font-semibold text-foreground tabular-nums">
            {tracker.budget != null ? `$${tracker.budget}` : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Earnings</p>
          <p className="text-xl font-semibold text-foreground tabular-nums">${tracker.earnings.toFixed(2)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">${tracker.hourlyRate || 0}/hr</p>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Time utilization</p>
          <p className="text-xs font-medium text-foreground tabular-nums">{Math.round(progress)}%</p>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isOvertime ? "bg-destructive" : progress > 80 ? "bg-warning" : "bg-success"}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <span>{formatTime(tracker.totalTimeSpend)}</span>
          <span>{formatTime(tracker.maximumTimeSeconds)}</span>
        </div>
        {tracker.overTime?.reason && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
            <svg className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-muted-foreground"><span className="font-medium text-destructive">Overtime:</span> {tracker.overTime.reason}</p>
          </div>
        )}
      </div>

      {/* ── Tasks ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Tasks ({tasks.length})</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="card overflow-hidden divide-y divide-border">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task._id);
            const taskSessions = sessions[task._id] || [];
            const isLoadingTaskSessions = loadingSessions.has(task._id);
            const taskProgress = tracker.maximumTimeSeconds > 0
              ? Math.round((task.totalDuration / tracker.maximumTimeSeconds) * 100)
              : 0;

            return (
              <div key={task._id}>
                <div className="px-4 py-3.5 flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    task.status === "inProgress" ? "bg-success animate-pulse" :
                    (task.status === "paused" || task.status === "pause") ? "bg-warning" :
                    "bg-muted-foreground/30"
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{task.tag}</span>
                      {task.status === "inProgress" && <span className="text-[10px] text-success font-medium">Active</span>}
                      {(task.status === "paused" || task.status === "pause") && <span className="text-[10px] text-warning font-medium">Paused</span>}
                      {(task.status === "completed" || task.status === "done") && <span className="text-[10px] text-muted-foreground">Done</span>}
                    </div>
                    {task.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.note}</p>}
                  </div>

                  {/* Duration */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground tabular-nums">{formatTime(task.totalDuration)}</p>
                    <p className="text-[10px] text-muted-foreground">{taskProgress}% of total</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleTaskExpansion(task._id)}
                      className="btn btn-ghost btn-icon w-7 h-7"
                      title={isExpanded ? "Hide sessions" : "View sessions"}
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveTaskForUpdate(task)}
                      disabled={updatingTasks.has(task._id)}
                      className="btn btn-ghost btn-icon w-7 h-7 disabled:opacity-50"
                      title="Edit time"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded sessions */}
                {isExpanded && (
                  <div className="bg-muted/30 border-t border-border px-4 py-3 animate-fade-in">
                    {isLoadingTaskSessions ? (
                      <div className="py-3 flex justify-center">
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : taskSessions.length > 0 ? (
                      <div className="space-y-0">
                        {taskSessions.map((session, idx) => (
                          <div key={session._id} className="flex items-center gap-3 py-2 text-xs">
                            <span className="w-5 text-center text-muted-foreground/50 tabular-nums">{idx + 1}</span>
                            <span className="text-muted-foreground tabular-nums">{formatDateTime(session.startTime)}</span>
                            <svg className="w-3 h-3 text-muted-foreground/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <span className="text-muted-foreground tabular-nums">
                              {session.endTime ? formatDateTime(session.endTime) : <span className="text-success">Running</span>}
                            </span>
                            <span className="ml-auto font-medium text-foreground tabular-nums">{formatTime(session.duration)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No sessions recorded</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <p className="text-sm text-muted-foreground">No tasks recorded for this project.</p>
        </div>
      )}

      {activeTaskForUpdate && (
        <UpdateTaskTimeModal isOpen={!!activeTaskForUpdate} onClose={() => setActiveTaskForUpdate(null)} taskId={activeTaskForUpdate._id} currentSeconds={activeTaskForUpdate.totalDuration} onSubmit={handleUpdateTaskTime} isSubmitting={updatingTasks.has(activeTaskForUpdate._id)} />
      )}
    </div>
  );
}
