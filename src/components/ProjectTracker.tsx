import { createIntersectionObserver } from "@solid-primitives/intersection-observer";
import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { createPersonalTracker, searchAdminTimeTrackers } from "~/lib/clientApi";
import type { AdminTimeTracker, TimeTracker } from "~/lib/types";
import AddTrackerModal from "./AddTrackerModal";
import PageLoader from "./PageLoader";
import SearchFilterBar from "./SearchFilterBar";

export default function ProjectTracker() {
  const navigate = useNavigate();
  const [trackers, setTrackers] = createSignal<TimeTracker[]>([]);
  const [skip, setSkip] = createSignal(0);
  const [hasMore, setHasMore] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(false);
  const [searchText, setSearchText] = createSignal("");
  const [dateRange, setDateRange] = createSignal({ start: "", end: "" });
  const [isAdmin, setIsAdmin] = createSignal(false);
  const [showAddTrackerModal, setShowAddTrackerModal] = createSignal(false);
  const [inView, setInView] = createSignal(false);
  const [sentinel, setSentinel] = createSignal<HTMLDivElement>();
  let initialLoadComplete = false;

  onMount(() => {
    const role = localStorage.getItem("user_role");
    setIsAdmin(role === "admin" || role === "owner");
  });

  createIntersectionObserver(
    () => {
      const el = sentinel();
      return el ? [el] : [];
    },
    (entries) => {
      for (const entry of entries) setInView(entry.isIntersecting);
    },
    { threshold: 0.1, rootMargin: "100px" },
  );

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

  const loadTrackers = async (
    text: string,
    date: { start: string; end: string },
    reset: boolean = false,
    filterType?: string,
  ) => {
    if (isLoading() || (!reset && !hasMore())) return;
    const currentSkip = reset ? 0 : skip();
    setIsLoading(true);

    try {
      const result: AdminTimeTracker[] = await searchAdminTimeTrackers(
        text,
        date,
        currentSkip,
        10,
        filterType || undefined,
      );
      const mappedResult: TimeTracker[] = result.map((admin) => ({
        _id: admin._id,
        overTime: admin.overTime,
        totalTimeSpend: admin.totalTimeSpend,
        maximumTimeSeconds: admin.maximumTimeSeconds,
        project: {
          _id: admin._id,
          name:
            admin.entryType === "manual"
              ? admin.manualProjectName || admin.projectName
              : admin.projectName,
          customerName: admin.customer || "Internal",
        },
      }));

      if (reset) {
        setTrackers(mappedResult);
        setSkip(10);
        setHasMore(mappedResult.length === 10);
      } else {
        const existingIds = new Set(trackers().map((t) => t._id));
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
  };

  onMount(() => {
    initialLoadComplete = true;
    loadTrackers("", { start: "", end: "" }, true);
  });

  const handleSearchFilter = (
    text: string,
    date: { start: string; end: string },
    filterType?: string,
  ) => {
    setSearchText(text);
    setDateRange(date);
    loadTrackers(text, date, true, filterType);
  };

  createEffect(() => {
    if (!initialLoadComplete) return;
    if (inView() && hasMore() && !isLoading() && trackers().length > 0) {
      loadTrackers(searchText(), dateRange());
    }
  });

  const handleAddPersonalTracker = async () => {
    setIsLoading(true);
    const newTracker = await createPersonalTracker();
    if (newTracker) {
      setIsLoading(false);
      loadTrackers(searchText(), dateRange(), true);
    } else {
      setIsLoading(false);
    }
  };

  const hasPersonalTasks = () =>
    trackers().some((t) => t.project.name === "Personal Tasks");

  return (
    <div class="animate-fade-in">
      {/* Header */}
      <div class="mb-6 space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-foreground tracking-tight">
              Project Tracker
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              Monitor and manage your design project timelines
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Show when={isAdmin()}>
              <button
                onClick={() => setShowAddTrackerModal(true)}
                class="btn btn-primary btn-sm gap-2 whitespace-nowrap"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </Show>
            <button
              onClick={handleAddPersonalTracker}
              disabled={hasPersonalTasks() || isLoading()}
              class="btn btn-secondary btn-sm gap-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              title={hasPersonalTasks() ? "Personal task already exists" : "Add Personal Task"}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
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
      <div class="space-y-3 stagger-items">
        <For each={trackers()}>
          {(tracker) => {
            const timeRemaining = () => tracker.maximumTimeSeconds - tracker.totalTimeSpend;
            const isOvertime = () => timeRemaining() < 0;
            const progress = () =>
              Math.min((tracker.totalTimeSpend / tracker.maximumTimeSeconds) * 100, 100);

            return (
              <div
                onClick={() => navigate(`/tracker/${tracker._id}`)}
                class="card card-interactive p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2.5 mb-2">
                    <div class={`w-2 h-2 rounded-full shrink-0 ${isOvertime() ? "bg-destructive animate-pulse" : "bg-success"}`} />
                    <h3 class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {tracker.project.customerName}'s {tracker.project.name}
                    </h3>
                  </div>

                  {/* Progress bar */}
                  <div class="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden mb-2.5">
                    <div
                      class={`h-full rounded-full transition-all duration-500 ${isOvertime() ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${progress()}%` }}
                    />
                  </div>

                  <div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>
                      Spent:{" "}
                      <span class="font-medium text-foreground">
                        {formatTime(tracker.totalTimeSpend)}
                      </span>
                    </span>
                    <span>
                      {isOvertime() ? "Over by: " : "Remaining: "}
                      <span class={`font-medium ${isOvertime() ? "text-destructive" : "text-foreground"}`}>
                        {formatTime(Math.abs(timeRemaining()))}
                      </span>
                    </span>
                  </div>

                  <Show when={tracker.overTime?.isOverTime && tracker.overTime?.reason}>
                    <div class="mt-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10 text-xs">
                      <span class="font-semibold text-destructive">Overtime reason:</span>
                      <p class="text-muted-foreground mt-0.5">{tracker.overTime.reason}</p>
                    </div>
                  </Show>
                </div>

                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      </div>

      <Show when={isLoading() && trackers().length === 0}>
        <PageLoader message="Loading projects..." />
      </Show>

      <Show when={isLoading() && trackers().length > 0}>
        <div class="flex justify-center py-8">
          <div class="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Show>

      <Show when={hasMore() && !isLoading()}>
        <div ref={setSentinel} class="flex justify-center py-12">
          <p class="text-sm text-muted-foreground">Loading more...</p>
        </div>
      </Show>

      <Show when={!hasMore() && trackers().length > 0}>
        <div class="text-center py-8 border-t border-border mt-4">
          <p class="text-sm text-muted-foreground">All projects loaded</p>
        </div>
      </Show>

      <Show when={trackers().length === 0 && !isLoading()}>
        <div class="card p-12 text-center">
          <div class="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p class="text-sm text-muted-foreground max-w-sm mx-auto">
            Your project queue is empty. New projects will appear here once assigned.
          </p>
        </div>
      </Show>

      <AddTrackerModal
        isOpen={showAddTrackerModal()}
        onClose={() => setShowAddTrackerModal(false)}
        onTrackerAdded={() => loadTrackers(searchText(), dateRange(), true)}
      />
    </div>
  );
}
