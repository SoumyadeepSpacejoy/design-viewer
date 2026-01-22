"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchTimeTrackerStates,
  fetchTimeTracker,
  fetchTaskSessions,
  updateTaskStatus,
  resumeTask,
} from "@/app/clientApi";
import { TimeTracker, TimeTrackerState, TimeTrackerSession } from "@/app/types";
import CreateTaskModal from "./CreateTaskModal";

interface TrackerDetailProps {
  tracker: TimeTracker;
  onBack: () => void;
}

export default function TrackerDetail({
  tracker: initialTracker,
  onBack,
}: TrackerDetailProps) {
  const [tracker, setTracker] = useState<TimeTracker>(initialTracker);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [sessions, setSessions] = useState<
    Record<string, TimeTrackerSession[]>
  >({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const pendingFetches = useRef<Set<string>>(new Set());

  const loadTracker = async () => {
    try {
      const updatedTracker = await fetchTimeTracker(tracker._id);
      if (updatedTracker) setTracker(updatedTracker);
    } catch (error) {
      console.error("Error refreshing tracker:", error);
    }
  };

  const loadTasks = async () => {
    if (pendingFetches.current.has(`tasks-${tracker._id}`)) return;
    pendingFetches.current.add(`tasks-${tracker._id}`);

    setIsLoading(true);
    try {
      const data = await fetchTimeTrackerStates(tracker._id);
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
      pendingFetches.current.delete(`tasks-${tracker._id}`);
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
    setTracker(initialTracker);
    loadTasks();
  }, [initialTracker._id]);

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    loadTasks(); // Refresh the tasks list
    loadTracker(); // Refresh summary cards
  };

  const handleUpdateStatus = async (taskId: string, type: "done" | "pause") => {
    setActiveActionId(`${taskId}-${type}`);
    try {
      await updateTaskStatus(taskId, type);
      await Promise.all([
        loadTasks(),
        loadTracker(),
        expandedTasks.has(taskId) ? loadSessions(taskId) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error(`Error updating task status to ${type}:`, error);
      alert(
        `Failed to ${type === "done" ? "end" : "pause"} task. Please try again.`,
      );
    } finally {
      setActiveActionId(null);
    }
  };

  const handleResumeTask = async (taskId: string) => {
    setActiveActionId(`${taskId}-resume`);
    try {
      await resumeTask(taskId);
      await Promise.all([
        loadTasks(),
        loadTracker(),
        expandedTasks.has(taskId) ? loadSessions(taskId) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error resuming task:", error);
      alert("Failed to resume task. Please try again.");
    } finally {
      setActiveActionId(null);
    }
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
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPackageName = () => {
    // 1. Try to find in order items first
    const orderItems = tracker.project.order?.items || [];
    const directPackage = orderItems.find((item) => {
      const name = item.name.toLowerCase();
      return (
        name.includes("delight") ||
        name.includes("bliss") ||
        name.includes("euphoria")
      );
    });

    if (directPackage) return directPackage.name;

    // 2. Fallback to name-based detection in project title
    const projectName = (tracker.project.name || "").toLowerCase();
    if (projectName.includes("euphoria")) return "Euphoria";
    if (projectName.includes("bliss")) return "Bliss";
    if (projectName.includes("delight")) return "Delight";

    return undefined;
  };

  const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
  const isOvertime = timeRemaining < 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Info Card */}
      <div className="mb-8 animate-fade-in-scale">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-pink-500/40 hover:text-pink-400 transition-colors group"
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
            Back to Projects
          </span>
        </button>

        <div className="glass-panel rounded-2xl border border-pink-500/10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-light text-pink-100 mb-4">
            {tracker.project.customerName}'s {tracker.project.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <svg
                  className="w-5 h-5 text-blue-400"
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
                <p className="text-blue-400 font-medium text-lg">
                  {formatTime(tracker.totalTimeSpend)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  isOvertime
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-green-500/10 border-green-500/20"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isOvertime ? "text-red-400" : "text-green-400"
                  }`}
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
                  className={`font-medium text-lg ${
                    isOvertime ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isOvertime
                    ? formatTime(Math.abs(timeRemaining))
                    : formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <svg
                  className="w-5 h-5 text-pink-400"
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
                  Maximum
                </p>
                <p className="text-pink-400 font-medium text-lg">
                  {formatTime(tracker.maximumTimeSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[-1px] z-20 py-4 mb-2 -mx-4 px-4 glass-panel backdrop-blur-md border-b border-pink-500/10 flex justify-between items-center animate-fade-in-scale">
        <h2 className="text-xl font-light text-pink-100">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-sm font-bold uppercase tracking-widest transition-all group"
        >
          <svg
            className="w-4 h-4 transform group-hover:rotate-90 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Task
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task._id);
            const taskSessions = sessions[task._id] || [];
            const isLoadingTaskSessions = loadingSessions.has(task._id);

            return (
              <div
                key={task._id}
                className="glass-panel rounded-2xl border border-pink-500/10 hover:border-pink-500/20 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                          <svg
                            className="w-3.5 h-3.5 text-pink-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <h3 className="text-sm font-bold text-pink-100 uppercase tracking-wider">
                            {task.tag}
                          </h3>
                        </div>
                        {task.status === "inProgress" && (
                          <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                            Live Session
                          </span>
                        )}
                        {(task.status === "paused" ||
                          task.status === "pause") && (
                          <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                            Paused
                          </span>
                        )}
                        {(task.status === "completed" ||
                          task.status === "done") && (
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/40 text-[10px] font-black uppercase tracking-widest">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-pink-300/40 text-[10px] uppercase font-black tracking-[0.2em] mb-1">
                            Current Performance
                          </p>
                          <p className="text-pink-400 font-medium text-lg tabular-nums">
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
                        <div className="mt-4 p-4 bg-black/40 rounded-xl border border-pink-500/10 group/note">
                          <div className="flex items-center gap-2 mb-2">
                            <svg
                              className="w-3.5 h-3.5 text-pink-400/60"
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
                            <span className="text-[10px] font-bold text-pink-400/40 uppercase tracking-[0.2em]">
                              Task Note
                            </span>
                          </div>
                          <p className="text-pink-300/70 text-sm leading-relaxed whitespace-pre-wrap">
                            {task.note}
                          </p>
                        </div>
                      )}
                    </div>

                    {task.status !== "completed" && task.status !== "done" && (
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        {task.status === "inProgress" ? (
                          <button
                            onClick={() =>
                              handleUpdateStatus(task._id, "pause")
                            }
                            disabled={activeActionId === `${task._id}-pause`}
                            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
                          >
                            {activeActionId === `${task._id}-pause` ? (
                              <div className="w-4 h-4 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                                Pause Task
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeTask(task._id)}
                            disabled={activeActionId === `${task._id}-resume`}
                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
                          >
                            {activeActionId === `${task._id}-resume` ? (
                              <div className="w-4 h-4 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5.14v14l11-7-11-7z" />
                                </svg>
                                Resume Task
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateStatus(task._id, "done")}
                          disabled={
                            activeActionId === `${task._id}-done` ||
                            task.status === "paused" ||
                            task.status === "pause"
                          }
                          title={
                            task.status === "paused" || task.status === "pause"
                              ? "Resume task to end it"
                              : ""
                          }
                          className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                        >
                          {activeActionId === `${task._id}-done` ? (
                            <div className="w-4 h-4 border-2 border-pink-400/20 border-t-pink-400 rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              End Task
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions Section */}
                {isExpanded && (
                  <div className="bg-black/20 border-t border-pink-500/10 px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-3 bg-pink-500 rounded-full"></div>
                      <h4 className="text-[10px] font-black text-pink-500/60 uppercase tracking-widest">
                        Working Sessions
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
                                    Running Now
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
        <div className="text-center py-12 glass-panel rounded-2xl border border-pink-500/10">
          <p className="text-pink-300/40 text-sm">
            No tasks yet. Create your first task to get started.
          </p>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trackerId={tracker._id}
        packageName={getPackageName()}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
