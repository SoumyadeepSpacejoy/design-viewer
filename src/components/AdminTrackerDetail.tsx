import { createEffect, createSignal, For, on, Show } from "solid-js";
import {
  fetchTaskSessions,
  fetchTimeTracker,
  fetchTimeTrackerStates,
  searchAdminTimeTrackers,
  updateTaskTime,
} from "~/lib/clientApi";
import type {
  AdminTimeTracker,
  TimeTrackerSession,
  TimeTrackerState,
} from "~/lib/types";
import PageLoader from "./PageLoader";
import UpdateTaskTimeModal from "./UpdateTaskTimeModal";

interface AdminTrackerDetailProps {
  trackerId: string;
}

export default function AdminTrackerDetail(props: AdminTrackerDetailProps) {
  const [tracker, setTracker] = createSignal<AdminTimeTracker | null>(null);
  const [tasks, setTasks] = createSignal<TimeTrackerState[]>([]);
  const [sessions, setSessions] = createSignal<Record<string, TimeTrackerSession[]>>({});
  const [loadingSessions, setLoadingSessions] = createSignal<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = createSignal<Set<string>>(new Set());
  const [isLoading, setIsLoading] = createSignal(true);
  const [updatingTasks, setUpdatingTasks] = createSignal<Set<string>>(new Set());
  const [activeTaskForUpdate, setActiveTaskForUpdate] =
    createSignal<TimeTrackerState | null>(null);
  let lastLoadedId: string | null = null;
  const pendingFetches = new Set<string>();

  const loadData = async () => {
    const trackerId = props.trackerId;
    if (lastLoadedId === trackerId) return;
    lastLoadedId = trackerId;
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
          projectName:
            enrichedData?.entryType === "manual"
              ? enrichedData?.manualProjectName || standardTracker.project.name
              : enrichedData?.projectName || standardTracker.project.name,
          customer:
            enrichedData?.customer || standardTracker.project.customerName || "Internal",
          designer: enrichedData?.designer || "",
          hourlyRate: enrichedData?.hourlyRate ?? standardTracker.hourlyRate ?? 0,
          earnings: enrichedData?.earnings ?? standardTracker.earnings ?? 0,
          budget: enrichedData?.budget ?? standardTracker.budget ?? 0,
        } as AdminTimeTracker);
      }
    } catch (error) {
      console.error("Error loading admin tracker detail:", error);
      lastLoadedId = null;
    } finally {
      setIsLoading(false);
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

  const handleUpdateTaskTime = async (totalSeconds: number) => {
    const active = activeTaskForUpdate();
    if (!active) return;
    const taskId = active._id;
    setUpdatingTasks((prev) => new Set(prev).add(taskId));
    try {
      await updateTaskTime(taskId, totalSeconds);
      lastLoadedId = null;
      await loadData();
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

  createEffect(on(() => props.trackerId, () => loadData()));

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

  const timeRemaining = () => tracker()!.maximumTimeSeconds - tracker()!.totalTimeSpend;
  const isOvertime = () => timeRemaining() < 0;
  const progress = () =>
    Math.min((tracker()!.totalTimeSpend / tracker()!.maximumTimeSeconds) * 100, 100);

  return (
    <Show
      when={!(isLoading() && !tracker())}
      fallback={<PageLoader message="Loading tracker..." />}
    >
      <Show
        when={tracker()}
        fallback={
          <div class="card py-12 text-center">
            <p class="text-sm text-muted-foreground">Tracker not found.</p>
          </div>
        }
      >
        {(t) => (
          <div class="animate-fade-in">
            {/* ── Header ── */}
            <div class="mb-8">
              <div class="flex items-start justify-between gap-4 mb-1">
                <h1 class="text-xl font-semibold text-foreground tracking-tight">
                  {t().customer}'s {t().projectName}
                </h1>
                <button
                  onClick={() => {
                    lastLoadedId = null;
                    loadData();
                  }}
                  disabled={isLoading()}
                  class="btn btn-ghost btn-sm btn-icon shrink-0"
                  title="Refresh"
                >
                  <svg class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <Show when={t().designer}>
                <p class="text-sm text-muted-foreground">by {t().designer}</p>
              </Show>
            </div>

            {/* ── Stats grid ── */}
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div class="card p-4">
                <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  Time Spent
                </p>
                <p class="text-xl font-semibold text-foreground tabular-nums">
                  {formatTime(t().totalTimeSpend)}
                </p>
              </div>
              <div class="card p-4">
                <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  {isOvertime() ? "Overtime" : "Remaining"}
                </p>
                <p class={`text-xl font-semibold tabular-nums ${isOvertime() ? "text-destructive" : "text-success"}`}>
                  {formatTime(Math.abs(timeRemaining()))}
                </p>
              </div>
              <div class="card p-4">
                <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  Budget
                </p>
                <p class="text-xl font-semibold text-foreground tabular-nums">
                  {t().budget != null ? `$${t().budget}` : "—"}
                </p>
              </div>
              <div class="card p-4">
                <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  Earnings
                </p>
                <p class="text-xl font-semibold text-foreground tabular-nums">
                  ${t().earnings.toFixed(2)}
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  ${t().hourlyRate || 0}/hr
                </p>
              </div>
            </div>

            {/* ── Progress ── */}
            <div class="card p-4 mb-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-muted-foreground">Time utilization</p>
                <p class="text-xs font-medium text-foreground tabular-nums">
                  {Math.round(progress())}%
                </p>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  class={`h-full rounded-full transition-all duration-700 ${
                    isOvertime() ? "bg-destructive" : progress() > 80 ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${Math.min(progress(), 100)}%` }}
                />
              </div>
              <div class="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                <span>{formatTime(t().totalTimeSpend)}</span>
                <span>{formatTime(t().maximumTimeSeconds)}</span>
              </div>
              <Show when={t().overTime?.reason}>
                <div class="mt-3 flex items-start gap-2 p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                  <svg class="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-xs text-muted-foreground">
                    <span class="font-medium text-destructive">Overtime:</span>{" "}
                    {t().overTime.reason}
                  </p>
                </div>
              </Show>
            </div>

            {/* ── Tasks ── */}
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-foreground">
                Tasks ({tasks().length})
              </h2>
            </div>

            <Show
              when={!isLoading()}
              fallback={
                <div class="flex justify-center py-12">
                  <div class="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              }
            >
              <Show
                when={tasks().length > 0}
                fallback={
                  <div class="card py-12 text-center">
                    <p class="text-sm text-muted-foreground">
                      No tasks recorded for this project.
                    </p>
                  </div>
                }
              >
                <div class="card overflow-hidden divide-y divide-border">
                  <For each={tasks()}>
                    {(task) => {
                      const isExpanded = () => expandedTasks().has(task._id);
                      const taskSessions = () => sessions()[task._id] || [];
                      const isLoadingTaskSessions = () => loadingSessions().has(task._id);
                      const taskProgress = () =>
                        t().maximumTimeSeconds > 0
                          ? Math.round((task.totalDuration / t().maximumTimeSeconds) * 100)
                          : 0;
                      const isPaused = () =>
                        task.status === "paused" || task.status === "pause";
                      const isDone = () =>
                        task.status === "completed" || task.status === "done";

                      return (
                        <div>
                          <div class="px-4 py-3.5 flex items-center gap-4">
                            {/* Status dot */}
                            <div
                              class={`w-2 h-2 rounded-full shrink-0 ${
                                task.status === "inProgress"
                                  ? "bg-success animate-pulse"
                                  : isPaused()
                                    ? "bg-warning"
                                    : "bg-muted-foreground/30"
                              }`}
                            />

                            {/* Info */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-foreground">
                                  {task.tag}
                                </span>
                                <Show when={task.status === "inProgress"}>
                                  <span class="text-[10px] text-success font-medium">Active</span>
                                </Show>
                                <Show when={isPaused()}>
                                  <span class="text-[10px] text-warning font-medium">Paused</span>
                                </Show>
                                <Show when={isDone()}>
                                  <span class="text-[10px] text-muted-foreground">Done</span>
                                </Show>
                              </div>
                              <Show when={task.note}>
                                <p class="text-xs text-muted-foreground mt-0.5 truncate">
                                  {task.note}
                                </p>
                              </Show>
                            </div>

                            {/* Duration */}
                            <div class="text-right shrink-0">
                              <p class="text-sm font-medium text-foreground tabular-nums">
                                {formatTime(task.totalDuration)}
                              </p>
                              <p class="text-[10px] text-muted-foreground">
                                {taskProgress()}% of total
                              </p>
                            </div>

                            {/* Actions */}
                            <div class="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleTaskExpansion(task._id)}
                                class="btn btn-ghost btn-icon w-7 h-7"
                                title={isExpanded() ? "Hide sessions" : "View sessions"}
                              >
                                <svg class={`w-3.5 h-3.5 transition-transform ${isExpanded() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setActiveTaskForUpdate(task)}
                                disabled={updatingTasks().has(task._id)}
                                class="btn btn-ghost btn-icon w-7 h-7 disabled:opacity-50"
                                title="Edit time"
                              >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Expanded sessions */}
                          <Show when={isExpanded()}>
                            <div class="bg-muted/30 border-t border-border px-4 py-3 animate-fade-in">
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
                                  <div class="space-y-0">
                                    <For each={taskSessions()}>
                                      {(session, idx) => (
                                        <div class="flex items-center gap-3 py-2 text-xs">
                                          <span class="w-5 text-center text-muted-foreground/50 tabular-nums">
                                            {idx() + 1}
                                          </span>
                                          <span class="text-muted-foreground tabular-nums">
                                            {formatDateTime(session.startTime)}
                                          </span>
                                          <svg class="w-3 h-3 text-muted-foreground/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                          </svg>
                                          <span class="text-muted-foreground tabular-nums">
                                            <Show
                                              when={session.endTime}
                                              fallback={<span class="text-success">Running</span>}
                                            >
                                              {formatDateTime(session.endTime!)}
                                            </Show>
                                          </span>
                                          <span class="ml-auto font-medium text-foreground tabular-nums">
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
        )}
      </Show>
    </Show>
  );
}
