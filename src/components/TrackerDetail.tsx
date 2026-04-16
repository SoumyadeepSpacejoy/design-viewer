"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchTimeTrackerStates,
  fetchTimeTracker,
  fetchTaskSessions,
  updateTaskStatus,
  resumeTask,
  updateTaskTime,
} from "@/app/clientApi";
import { TimeTracker, TimeTrackerState, TimeTrackerSession } from "@/app/types";
import CreateTaskModal from "./CreateTaskModal";
import OvertimeReasonModal from "./OvertimeReasonModal";
import ManualTimeModal from "./ManualTimeModal";
import UpdateTaskTimeModal from "./UpdateTaskTimeModal";
import PageLoader from "./PageLoader";

interface TrackerDetailProps {
  tracker: TimeTracker;
  onBack: () => void;
}

export default function TrackerDetail({ tracker: initialTracker, onBack }: TrackerDetailProps) {
  const [tracker, setTracker] = useState<TimeTracker>(initialTracker);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [sessions, setSessions] = useState<Record<string, TimeTrackerSession[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [activeTaskForUpdate, setActiveTaskForUpdate] = useState<TimeTrackerState | null>(null);
  const pendingFetches = useRef<Set<string>>(new Set());

  const loadTracker = async () => {
    try {
      const updatedTracker = await fetchTimeTracker(tracker._id);
      if (updatedTracker) { setTracker(updatedTracker); return updatedTracker; }
    } catch (error) { console.error("Error refreshing tracker:", error); }
    return null;
  };

  const loadTasks = async () => {
    if (pendingFetches.current.has(`tasks-${tracker._id}`)) return;
    pendingFetches.current.add(`tasks-${tracker._id}`);
    setIsLoading(true);
    try {
      const data = await fetchTimeTrackerStates(tracker._id);
      setTasks(data);
    } catch (error) { console.error("Error loading tasks:", error); }
    finally { setIsLoading(false); pendingFetches.current.delete(`tasks-${tracker._id}`); }
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

  useEffect(() => { setTracker(initialTracker); loadTasks(); loadTracker(); }, [initialTracker._id]);

  const handleTaskCreated = () => { setIsModalOpen(false); loadTasks(); loadTracker(); };

  const handleUpdateStatus = async (taskId: string, type: "done" | "pause") => {
    setActiveActionId(`${taskId}-${type}`);
    try {
      await updateTaskStatus(taskId, type);
      const results = await Promise.all([loadTasks(), loadTracker(), expandedTasks.has(taskId) ? loadSessions(taskId) : Promise.resolve()]);
      const updatedTracker = results[1] as TimeTracker | null;
      const isActuallyOvertime = (updatedTracker?.totalTimeSpend || 0) > (updatedTracker?.maximumTimeSeconds || 0);
      const hasNoReason = !updatedTracker?.overTime?.reason || updatedTracker.overTime.reason.trim() === "";
      if (type === "done" && isActuallyOvertime && hasNoReason) setIsOvertimeModalOpen(true);
    } catch (error) { console.error(`Error updating task status to ${type}:`, error); alert(`Failed to ${type === "done" ? "end" : "pause"} task.`); }
    finally { setActiveActionId(null); }
  };

  const handleResumeTask = async (taskId: string) => {
    setActiveActionId(`${taskId}-resume`);
    try {
      await resumeTask(taskId);
      await Promise.all([loadTasks(), loadTracker(), expandedTasks.has(taskId) ? loadSessions(taskId) : Promise.resolve()]);
    } catch (error) { console.error("Error resuming task:", error); alert("Failed to resume task."); }
    finally { setActiveActionId(null); }
  };

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

  const handleUpdateTaskTime = async (totalSeconds: number) => {
    if (!activeTaskForUpdate) return;
    const taskId = activeTaskForUpdate._id;
    setUpdatingTasks((prev) => new Set(prev).add(taskId));
    try {
      await updateTaskTime(taskId, totalSeconds);
      await Promise.all([loadTracker(), loadTasks()]);
      setActiveTaskForUpdate(null);
    } catch (error) { console.error("Failed to update task time:", error); window.alert("Failed to update task time."); }
    finally { setUpdatingTasks((prev) => { const next = new Set(prev); next.delete(taskId); return next; }); }
  };

  const getPackageName = () => {
    const orderItems = tracker.project.order?.items || [];
    const directPackage = orderItems.find((item) => {
      const name = item.name.toLowerCase();
      return name.includes("delight") || name.includes("bliss") || name.includes("euphoria");
    });
    if (directPackage) return directPackage.name;
    const projectName = (tracker.project.name || "").toLowerCase();
    if (projectName.includes("euphoria")) return "Euphoria";
    if (projectName.includes("bliss")) return "Bliss";
    if (projectName.includes("delight")) return "Delight";
    return undefined;
  };

  const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
  const isOvertime = timeRemaining < 0;
  const progress = Math.min((tracker.totalTimeSpend / tracker.maximumTimeSeconds) * 100, 100);

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button onClick={onBack} className="btn btn-ghost btn-sm gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Projects
      </button>

      {/* Summary card */}
      <div className="card p-6 mb-6">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          {tracker.project.customerName}&apos;s {tracker.project.name}
        </h1>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-all duration-500 ${isOvertime ? "bg-destructive" : "bg-primary"}`} style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Time Spent</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground tabular-nums">{formatTime(tracker.totalTimeSpend)}</p>
              <button onClick={() => setIsManualTimeModalOpen(true)} className="btn btn-ghost btn-icon w-6 h-6" title="Edit Time">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{isOvertime ? "Overtime" : "Remaining"}</p>
            <p className={`text-lg font-semibold tabular-nums ${isOvertime ? "text-destructive" : "text-success"}`}>
              {formatTime(Math.abs(timeRemaining))}
            </p>
            {tracker.overTime?.reason && (
              <div className="mt-2 p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                <p className="text-xs text-destructive font-medium">Overtime: {tracker.overTime.reason}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Maximum</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatTime(tracker.maximumTimeSeconds)}</p>
          </div>
        </div>
      </div>

      {/* Tasks header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Task
        </button>
      </div>

      {/* Task list */}
      {isLoading ? (
        <PageLoader message="Loading tasks..." />
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task._id);
            const taskSessions = sessions[task._id] || [];
            const isLoadingTaskSessions = loadingSessions.has(task._id);

            return (
              <div key={task._id} className="card overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{task.tag}</span>
                        {task.status === "inProgress" && <span className="badge badge-success">Active</span>}
                        {(task.status === "paused" || task.status === "pause") && <span className="badge badge-warning">Paused</span>}
                        {(task.status === "completed" || task.status === "done") && <span className="badge" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>Done</span>}
                      </div>

                      <p className="text-sm text-foreground tabular-nums font-medium">{formatTime(task.totalDuration)}</p>

                      {task.note && (
                        <div className="mt-2 p-2.5 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">{task.note}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => toggleTaskExpansion(task._id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                          {isExpanded ? "Hide" : "View"} Sessions
                          <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setActiveTaskForUpdate(task)}
                          disabled={updatingTasks.has(task._id)}
                          className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                        >
                          {updatingTasks.has(task._id) ? "Updating..." : "Edit Time"}
                        </button>
                      </div>
                    </div>

                    {task.status !== "completed" && task.status !== "done" && (
                      <div className="flex gap-2 shrink-0">
                        {task.status === "inProgress" ? (
                          <button
                            onClick={() => handleUpdateStatus(task._id, "pause")}
                            disabled={activeActionId === `${task._id}-pause`}
                            className="btn btn-sm bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
                          >
                            {activeActionId === `${task._id}-pause` ? (
                              <div className="w-3.5 h-3.5 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                            ) : "Pause"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeTask(task._id)}
                            disabled={activeActionId === `${task._id}-resume`}
                            className="btn btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20"
                          >
                            {activeActionId === `${task._id}-resume` ? (
                              <div className="w-3.5 h-3.5 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                            ) : "Resume"}
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(task._id, "done")}
                          disabled={activeActionId === `${task._id}-done` || task.status === "paused" || task.status === "pause"}
                          title={task.status === "paused" || task.status === "pause" ? "Resume task to end it" : ""}
                          className="btn btn-sm btn-primary"
                        >
                          {activeActionId === `${task._id}-done` ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : "End"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions */}
                {isExpanded && (
                  <div className="bg-muted/30 border-t border-border px-4 sm:px-5 py-3 animate-fade-in">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3">Sessions</h4>
                    {isLoadingTaskSessions ? (
                      <div className="py-3 flex justify-center">
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : taskSessions.length > 0 ? (
                      <div className="space-y-1.5">
                        {taskSessions.map((session) => (
                          <div key={session._id} className="flex items-center justify-between text-xs py-1.5">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span className="tabular-nums">{formatDateTime(session.startTime)}</span>
                              <span className="text-border">→</span>
                              <span className="tabular-nums">
                                {session.endTime ? formatDateTime(session.endTime) : <span className="text-success animate-pulse">Running</span>}
                              </span>
                            </div>
                            <span className="font-medium text-foreground tabular-nums">{formatTime(session.duration)}</span>
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
          <p className="text-sm text-muted-foreground">No tasks yet. Create your first task to get started.</p>
        </div>
      )}

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} trackerId={tracker._id} packageName={getPackageName()} onTaskCreated={handleTaskCreated} />
      <OvertimeReasonModal isOpen={isOvertimeModalOpen} onClose={() => setIsOvertimeModalOpen(false)} trackerId={tracker._id} onReasonSubmitted={loadTracker} />
      <ManualTimeModal isOpen={isManualTimeModalOpen} onClose={() => setIsManualTimeModalOpen(false)} projectId={tracker.project._id} currentSeconds={tracker.totalTimeSpend} onTimeUpdated={() => { loadTracker(); loadTasks(); }} />
      {activeTaskForUpdate && (
        <UpdateTaskTimeModal isOpen={!!activeTaskForUpdate} onClose={() => setActiveTaskForUpdate(null)} taskId={activeTaskForUpdate._id} currentSeconds={activeTaskForUpdate.totalDuration} onSubmit={handleUpdateTaskTime} isSubmitting={updatingTasks.has(activeTaskForUpdate._id)} />
      )}
    </div>
  );
}
