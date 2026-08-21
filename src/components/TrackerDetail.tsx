import { createEffect, createSignal, For, on, Show } from "solid-js";
import {
  fetchTaskSessions,
  fetchTimeTracker,
  fetchTimeTrackerStates,
  resumeTask,
  updateTaskStatus,
  updateTaskTime,
} from "~/lib/clientApi";
import type {
  TimeTracker,
  TimeTrackerSession,
  TimeTrackerState,
} from "~/lib/types";
import CreateTaskModal from "./CreateTaskModal";
import ManualTimeModal from "./ManualTimeModal";
import OvertimeReasonModal from "./OvertimeReasonModal";
import PageLoader from "./PageLoader";
import UpdateTaskTimeModal from "./UpdateTaskTimeModal";

interface TrackerDetailProps {
  tracker: TimeTracker;
  onBack: () => void;
}

export default function TrackerDetail(props: TrackerDetailProps) {
  const [tracker, setTracker] = createSignal<TimeTracker>(props.tracker);
  const [tasks, setTasks] = createSignal<TimeTrackerState[]>([]);
  const [sessions, setSessions] = createSignal<Record<string, TimeTrackerSession[]>>({});
  const [loadingSessions, setLoadingSessions] = createSignal<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = createSignal<Set<string>>(new Set());
  const [isLoading, setIsLoading] = createSignal(true);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = createSignal(false);
  const [isManualTimeModalOpen, setIsManualTimeModalOpen] = createSignal(false);
  const [activeActionId, setActiveActionId] = createSignal<string | null>(null);
  const [updatingTasks, setUpdatingTasks] = createSignal<Set<string>>(new Set());
  const [activeTaskForUpdate, setActiveTaskForUpdate] =
    createSignal<TimeTrackerState | null>(null);
  const pendingFetches = new Set<string>();

  const loadTracker = async () => {
    try {
      const updatedTracker = await fetchTimeTracker(tracker()._id);
      if (updatedTracker) {
        setTracker(updatedTracker);
        return updatedTracker;
      }
    } catch (error) {
      console.error("Error refreshing tracker:", error);
    }
    return null;
  };

  const loadTasks = async () => {
    const key = `tasks-${tracker()._id}`;
    if (pendingFetches.has(key)) return;
    pendingFetches.add(key);
    setIsLoading(true);
    try {
      setTasks(await fetchTimeTrackerStates(tracker()._id));
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
      pendingFetches.delete(key);
    }
  };

  const loadSessions = async (taskId: string) => {
    const key = `sessions-${taskId}`;
    if (pendingFetches.has(key)) return;
    pendingFetches.add(key);
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
      pendingFetches.delete(key);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const next = new Set(expandedTasks());
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
      if (!sessions()[taskId]) loadSessions(taskId);
    }
    setExpandedTasks(next);
  };

  // Re-runs only when the route hands us a different tracker. `on` keeps the
  // body untracked, so the tracker() reads inside the loaders don't re-trigger it.
  createEffect(
    on(
      () => props.tracker,
      (t) => {
        setTracker(t);
        loadTasks();
        loadTracker();
      },
    ),
  );

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    loadTasks();
    loadTracker();
  };

  const handleUpdateStatus = async (taskId: string, type: "done" | "pause") => {
    setActiveActionId(`${taskId}-${type}`);
    try {
      await updateTaskStatus(taskId, type);
      const results = await Promise.all([
        loadTasks(),
        loadTracker(),
        expandedTasks().has(taskId) ? loadSessions(taskId) : Promise.resolve(),
      ]);
      const updatedTracker = results[1] as TimeTracker | null;
      const isActuallyOvertime =
        (updatedTracker?.totalTimeSpend || 0) > (updatedTracker?.maximumTimeSeconds || 0);
      const hasNoReason =
        !updatedTracker?.overTime?.reason || updatedTracker.overTime.reason.trim() === "";
      if (type === "done" && isActuallyOvertime && hasNoReason) setIsOvertimeModalOpen(true);
    } catch (error) {
      console.error(`Error updating task status to ${type}:`, error);
      alert(`Failed to ${type === "done" ? "end" : "pause"} task.`);
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
        expandedTasks().has(taskId) ? loadSessions(taskId) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error resuming task:", error);
      alert("Failed to resume task.");
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

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleUpdateTaskTime = async (totalSeconds: number) => {
    const active = activeTaskForUpdate();
    if (!active) return;
    const taskId = active._id;
    setUpdatingTasks((prev) => new Set(prev).add(taskId));
    try {
      await updateTaskTime(taskId, totalSeconds);
      await Promise.all([loadTracker(), loadTasks()]);
      setActiveTaskForUpdate(null);
    } catch (error) {
      console.error("Failed to update task time:", error);
      window.alert("Failed to update task time.");
    } finally {
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const getPackageName = () => {
    const orderItems = tracker().project.order?.items || [];
    const directPackage = orderItems.find((item) => {
      const name = item.name.toLowerCase();
      return name.includes("delight") || name.includes("bliss") || name.includes("euphoria");
    });
    if (directPackage) return directPackage.name;
    const projectName = (tracker().project.name || "").toLowerCase();
    if (projectName.includes("euphoria")) return "Euphoria";
    if (projectName.includes("bliss")) return "Bliss";
    if (projectName.includes("delight")) return "Delight";
    return undefined;
  };

  const timeRemaining = () => tracker().maximumTimeSeconds - tracker().totalTimeSpend;
  const isOvertime = () => timeRemaining() < 0;
  const progress = () =>
    Math.min((tracker().totalTimeSpend / tracker().maximumTimeSeconds) * 100, 100);

  return (
    <div class="animate-fade-in">
      {/* Back */}
      <button onClick={() => props.onBack()} class="btn btn-ghost btn-sm gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Projects
      </button>

      {/* Summary card */}
      <div class="card p-6 mb-6">
        <h1 class="text-xl font-semibold text-foreground mb-4">
          {tracker().project.customerName}'s {tracker().project.name}
        </h1>

        {/* Progress bar */}
        <div class="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div
            class={`h-full rounded-full transition-all duration-500 ${isOvertime() ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${progress()}%` }}
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-muted-foreground mb-1">Time Spent</p>
            <div class="flex items-center gap-2">
              <p class="text-lg font-semibold text-foreground tabular-nums">
                {formatTime(tracker().totalTimeSpend)}
              </p>
              <button
                onClick={() => setIsManualTimeModalOpen(true)}
                class="btn btn-ghost btn-icon w-6 h-6"
                title="Edit Time"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-1">
              {isOvertime() ? "Overtime" : "Remaining"}
            </p>
            <p class={`text-lg font-semibold tabular-nums ${isOvertime() ? "text-destructive" : "text-success"}`}>
              {formatTime(Math.abs(timeRemaining()))}
            </p>
            <Show when={tracker().overTime?.reason}>
              <div class="mt-2 p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                <p class="text-xs text-destructive font-medium">
                  Overtime: {tracker().overTime.reason}
                </p>
              </div>
            </Show>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-1">Maximum</p>
            <p class="text-lg font-semibold text-foreground tabular-nums">
              {formatTime(tracker().maximumTimeSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks header */}
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground">Tasks</h2>
        <button onClick={() => setIsModalOpen(true)} class="btn btn-primary btn-sm gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Task
        </button>
      </div>

      {/* Task list */}
      <Show when={!isLoading()} fallback={<PageLoader message="Loading tasks..." />}>
        <Show
          when={tasks().length > 0}
          fallback={
            <div class="card py-12 text-center">
              <p class="text-sm text-muted-foreground">
                No tasks yet. Create your first task to get started.
              </p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={tasks()}>
              {(task) => {
                const isExpanded = () => expandedTasks().has(task._id);
                const taskSessions = () => sessions()[task._id] || [];
                const isLoadingTaskSessions = () => loadingSessions().has(task._id);
                const isDone = () => task.status === "completed" || task.status === "done";
                const isPaused = () => task.status === "paused" || task.status === "pause";

                return (
                  <div class="card overflow-hidden">
                    <div class="p-4 sm:p-5">
                      <div class="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-2 flex-wrap">
                            <span class="text-sm font-semibold text-foreground">{task.tag}</span>
                            <Show when={task.status === "inProgress"}>
                              <span class="badge badge-success">Active</span>
                            </Show>
                            <Show when={isPaused()}>
                              <span class="badge badge-warning">Paused</span>
                            </Show>
                            <Show when={isDone()}>
                              <span
                                class="badge"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                              >
                                Done
                              </span>
                            </Show>
                          </div>

                          <p class="text-sm text-foreground tabular-nums font-medium">
                            {formatTime(task.totalDuration)}
                          </p>

                          <Show when={task.note}>
                            <div class="mt-2 p-2.5 bg-muted/50 rounded-lg">
                              <p class="text-xs text-muted-foreground">{task.note}</p>
                            </div>
                          </Show>

                          <div class="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => toggleTaskExpansion(task._id)}
                              class="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {isExpanded() ? "Hide" : "View"} Sessions
                              <svg class={`w-3 h-3 transition-transform ${isExpanded() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setActiveTaskForUpdate(task)}
                              disabled={updatingTasks().has(task._id)}
                              class="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                            >
                              {updatingTasks().has(task._id) ? "Updating..." : "Edit Time"}
                            </button>
                          </div>
                        </div>

                        <Show when={!isDone()}>
                          <div class="flex gap-2 shrink-0">
                            <Show
                              when={task.status === "inProgress"}
                              fallback={
                                <button
                                  onClick={() => handleResumeTask(task._id)}
                                  disabled={activeActionId() === `${task._id}-resume`}
                                  class="btn btn-sm bg-success/10 text-success border border-success/20 hover:bg-success/20"
                                >
                                  <Show
                                    when={activeActionId() === `${task._id}-resume`}
                                    fallback="Resume"
                                  >
                                    <div class="w-3.5 h-3.5 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                                  </Show>
                                </button>
                              }
                            >
                              <button
                                onClick={() => handleUpdateStatus(task._id, "pause")}
                                disabled={activeActionId() === `${task._id}-pause`}
                                class="btn btn-sm bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
                              >
                                <Show
                                  when={activeActionId() === `${task._id}-pause`}
                                  fallback="Pause"
                                >
                                  <div class="w-3.5 h-3.5 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                                </Show>
                              </button>
                            </Show>
                            <button
                              onClick={() => handleUpdateStatus(task._id, "done")}
                              disabled={activeActionId() === `${task._id}-done` || isPaused()}
                              title={isPaused() ? "Resume task to end it" : ""}
                              class="btn btn-sm btn-primary"
                            >
                              <Show when={activeActionId() === `${task._id}-done`} fallback="End">
                                <div class="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              </Show>
                            </button>
                          </div>
                        </Show>
                      </div>
                    </div>

                    {/* Sessions */}
                    <Show when={isExpanded()}>
                      <div class="bg-muted/30 border-t border-border px-4 sm:px-5 py-3 animate-fade-in">
                        <h4 class="text-xs font-medium text-muted-foreground mb-3">Sessions</h4>
                        <Show
                          when={!isLoadingTaskSessions()}
                          fallback={
                            <div class="py-3 flex justify-center">
                              <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                          }
                        >
                          <Show
                            when={taskSessions().length > 0}
                            fallback={
                              <p class="text-xs text-muted-foreground text-center py-2">
                                No sessions recorded
                              </p>
                            }
                          >
                            <div class="space-y-1.5">
                              <For each={taskSessions()}>
                                {(session) => (
                                  <div class="flex items-center justify-between text-xs py-1.5">
                                    <div class="flex items-center gap-3 text-muted-foreground">
                                      <span class="tabular-nums">
                                        {formatDateTime(session.startTime)}
                                      </span>
                                      <span class="text-border">→</span>
                                      <span class="tabular-nums">
                                        <Show
                                          when={session.endTime}
                                          fallback={
                                            <span class="text-success animate-pulse">Running</span>
                                          }
                                        >
                                          {formatDateTime(session.endTime!)}
                                        </Show>
                                      </span>
                                    </div>
                                    <span class="font-medium text-foreground tabular-nums">
                                      {formatTime(session.duration)}
                                    </span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </Show>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>

      <CreateTaskModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        trackerId={tracker()._id}
        packageName={getPackageName()}
        onTaskCreated={handleTaskCreated}
      />
      <OvertimeReasonModal
        isOpen={isOvertimeModalOpen()}
        onClose={() => setIsOvertimeModalOpen(false)}
        trackerId={tracker()._id}
        onReasonSubmitted={loadTracker}
      />
      <ManualTimeModal
        isOpen={isManualTimeModalOpen()}
        onClose={() => setIsManualTimeModalOpen(false)}
        projectId={tracker().project._id}
        currentSeconds={tracker().totalTimeSpend}
        onTimeUpdated={() => {
          loadTracker();
          loadTasks();
        }}
      />
      <Show when={activeTaskForUpdate()}>
        {(active) => (
          <UpdateTaskTimeModal
            isOpen={true}
            onClose={() => setActiveTaskForUpdate(null)}
            taskId={active()._id}
            currentSeconds={active().totalDuration}
            onSubmit={handleUpdateTaskTime}
            isSubmitting={updatingTasks().has(active()._id)}
          />
        )}
      </Show>
    </div>
  );
}
