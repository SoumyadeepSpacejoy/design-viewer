import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { searchAdminTimeTrackers } from "~/lib/clientApi";
import type { AdminTimeTracker } from "~/lib/types";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

export default function DesignerTrackerDashboard() {
  const navigate = useNavigate();
  const [trackers, setTrackers] = createSignal<AdminTimeTracker[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [hasMore, setHasMore] = createSignal(true);
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());

  // Search & filter state (inline, not a separate component)
  const [searchText, setSearchText] = createSignal("");
  const [activeRange, setActiveRange] = createSignal<string | null>(null);
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");

  const limit = 30;
  // Plain mutable refs: these drive fetch bookkeeping, not rendering.
  let skipRef = 0;
  let hasMoreRef = true;
  let searchState = { text: "", date: { start: "", end: "" }, filterType: "" };
  let isLoadingRef = false;
  const [sentinel, setSentinel] = createSignal<HTMLDivElement>();
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>();

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

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const calculateRange = (range: string) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    let start = new Date(baseDate);
    let end = new Date(baseDate);
    switch (range) {
      case "daily":
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        start.setDate(baseDate.getDate() - baseDate.getDay());
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        start = new Date(baseDate.getFullYear(), 0, 1);
        end = new Date(baseDate.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start: formatDate(start), end: formatDate(end) };
  };

  const loadTrackers = async (reset: boolean = false) => {
    if (isLoadingRef) return;
    if (!reset && !hasMoreRef) return;

    isLoadingRef = true;
    setIsLoading(true);

    const currentSkip = reset ? 0 : skipRef;
    const { text, date, filterType } = searchState;

    try {
      const data = await searchAdminTimeTrackers(
        text,
        date,
        currentSkip,
        limit,
        filterType || undefined,
      );
      if (reset) {
        setTrackers(data);
      } else {
        setTrackers((prev) => [...prev, ...data]);
      }
      skipRef = currentSkip + limit;
      const more = data.length >= limit;
      hasMoreRef = more;
      setHasMore(more);
    } catch (error) {
      console.error("Error loading trackers:", error);
    } finally {
      isLoadingRef = false;
      setIsLoading(false);
    }
  };

  onMount(() => {
    loadTrackers(true);
  });

  createEffect(() => {
    const sentinelEl = sentinel();
    const containerEl = scrollContainer();
    if (!sentinelEl || !containerEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef && hasMoreRef) {
          loadTrackers(false);
        }
      },
      { root: containerEl, threshold: 0.1 },
    );
    observer.observe(sentinelEl);
    onCleanup(() => observer.disconnect());
  });

  const triggerSearch = (
    text: string,
    date: { start: string; end: string },
    filterType?: string,
  ) => {
    searchState = { text, date, filterType: filterType || "" };
    skipRef = 0;
    hasMoreRef = true;
    setHasMore(true);
    setTrackers([]);
    setTimeout(() => loadTrackers(true), 0);
  };

  const handleSearchSubmit = () => {
    triggerSearch(
      searchText(),
      { start: startDate(), end: endDate() },
      activeRange() || undefined,
    );
  };

  const handleRangeClick = (range: string) => {
    const isDeactivating = activeRange() === range;
    const newRange = isDeactivating ? null : range;
    setActiveRange(newRange);
    let newDates = { start: "", end: "" };
    if (newRange) newDates = calculateRange(newRange);
    setStartDate(newDates.start);
    setEndDate(newDates.end);
    triggerSearch(searchText(), newDates, newRange || undefined);
  };

  const handleReset = () => {
    setSearchText("");
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    triggerSearch("", { start: "", end: "" });
  };

  const allSelected = () =>
    selectedIds().size === trackers().length && trackers().length > 0;

  const toggleSelectAll = () => {
    if (allSelected()) {
      setSelectedIds(new Set<string>());
    } else {
      setSelectedIds(new Set(trackers().map((t) => t._id)));
    }
  };

  const toggleSelect = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds());
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedTrackers = () => trackers().filter((t) => selectedIds().has(t._id));
  const selectedEarnings = () =>
    selectedTrackers().reduce((sum, t) => sum + t.earnings, 0);
  const selectedTime = () =>
    selectedTrackers().reduce((sum, t) => sum + t.totalTimeSpend, 0);

  return (
    <div
      class="animate-fade-in -m-4 sm:-m-6 lg:-m-8 flex flex-col"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* ── Toolbar ── */}
      <div class="shrink-0 bg-card border-b border-border px-4 py-2.5 flex flex-col gap-2">
        {/* Row 1: title + search */}
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-sm font-semibold text-foreground whitespace-nowrap mr-2">
            Designer Insights
          </h1>

          {/* Search */}
          <div class="relative flex-1 min-w-[200px] max-w-md">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              class="input h-8 text-xs"
              style={{ "padding-left": "2.25rem" }}
              placeholder="Search designers or projects..."
              value={searchText()}
              onInput={(e) => setSearchText(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />
          </div>

          {/* Quick period pills */}
          <div class="flex items-center gap-1">
            <For each={["daily", "weekly", "monthly", "yearly"]}>
              {(range) => (
                <button
                  onClick={() => handleRangeClick(range)}
                  class={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all ${
                    activeRange() === range
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {range}
                </button>
              )}
            </For>
          </div>

          {/* Calendar date range picker */}
          <DateRangePicker
            startDate={startDate()}
            endDate={endDate()}
            onRangeChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
              setActiveRange(null);
              if (s && e) {
                triggerSearch(searchText(), { start: s, end: e });
              } else if (!s && !e) {
                triggerSearch(searchText(), { start: "", end: "" });
              }
            }}
          />

          <div class="flex items-center gap-1.5 ml-auto">
            <button onClick={handleSearchSubmit} class="btn btn-primary h-8 text-xs px-3">
              Search
            </button>
            <Show when={searchText() || startDate() || endDate() || activeRange()}>
              <button onClick={handleReset} class="btn btn-ghost h-8 text-xs px-3">
                Clear
              </button>
            </Show>
          </div>
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div class="shrink-0 bg-muted/60 border-b border-border flex items-center px-4 h-9 text-[11px] font-semibold text-muted-foreground select-none">
        <div class="w-9 shrink-0">
          <button
            onClick={toggleSelectAll}
            class={`w-4 h-4 rounded border-[1.5px] transition-all flex items-center justify-center ${
              allSelected() ? "bg-primary border-primary" : "border-border hover:border-muted-foreground"
            }`}
          >
            <Show when={allSelected()}>
              <svg class="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </Show>
          </button>
        </div>
        <div class="w-[200px] shrink-0">Designer</div>
        <div class="flex-1 min-w-0 hidden md:block">Project</div>
        <div class="w-[100px] hidden lg:block">Customer</div>
        <div class="w-[100px] text-right hidden sm:block">Time Spent</div>
        <div class="w-[90px] text-right">Earnings</div>
        <div class="w-[72px] text-center hidden lg:block">Status</div>
      </div>

      {/* ── Spreadsheet Body ── */}
      <div ref={setScrollContainer} class="flex-1 overflow-y-auto min-h-0">
        <For each={trackers()}>
          {(tracker, index) => {
            const isSelected = () => selectedIds().has(tracker._id);
            const isOvertime = () => tracker.overTime?.isOverTime;
            return (
              <div
                onClick={() => navigate(`/designers/${tracker._id}`)}
                class={`flex items-center px-4 h-10 border-b border-border/60 cursor-pointer transition-colors text-[13px] ${
                  isSelected()
                    ? "bg-primary/[0.06]"
                    : index() % 2 === 0
                      ? "bg-background"
                      : "bg-muted/20"
                } hover:bg-primary/[0.04]`}
              >
                {/* Checkbox */}
                <div class="w-9 shrink-0" onClick={(e) => toggleSelect(tracker._id, e)}>
                  <div
                    class={`w-4 h-4 rounded border-[1.5px] transition-all flex items-center justify-center ${
                      isSelected()
                        ? "bg-primary border-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Show when={isSelected()}>
                      <svg class="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </Show>
                  </div>
                </div>

                {/* Designer */}
                <div class="w-[200px] shrink-0 flex items-center gap-2.5 min-w-0">
                  <div class="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                    {tracker.designer[0]}
                  </div>
                  <span class="text-sm font-medium text-foreground truncate">
                    {tracker.designer}
                  </span>
                </div>

                {/* Project */}
                <div class="flex-1 min-w-0 hidden md:flex items-center gap-2">
                  <span class="text-sm text-foreground truncate">
                    {tracker.entryType === "manual"
                      ? tracker.manualProjectName
                      : tracker.projectName}
                  </span>
                </div>

                {/* Customer */}
                <div class="w-[100px] hidden lg:block">
                  <span class="text-sm text-muted-foreground truncate block">
                    {tracker.customer}
                  </span>
                </div>

                {/* Time */}
                <div class="w-[100px] text-right hidden sm:block">
                  <span class="text-sm tabular-nums text-foreground">
                    {formatTime(tracker.totalTimeSpend)}
                  </span>
                </div>

                {/* Earnings */}
                <div class="w-[90px] text-right">
                  <span class="text-sm font-medium tabular-nums text-foreground">
                    ${tracker.earnings.toFixed(2)}
                  </span>
                </div>

                {/* Status */}
                <div class="w-[72px] hidden lg:flex justify-center">
                  <Show
                    when={isOvertime()}
                    fallback={
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success">
                        <span class="w-1.5 h-1.5 rounded-full bg-success" />
                        OK
                      </span>
                    }
                  >
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                      <span class="w-1.5 h-1.5 rounded-full bg-destructive" />
                      Over
                    </span>
                  </Show>
                </div>
              </div>
            );
          }}
        </For>

        <Show when={!isLoading() && trackers().length === 0}>
          <div class="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No data found
          </div>
        </Show>

        <Show when={isLoading() && trackers().length === 0}>
          <PageLoader message="Loading data..." />
        </Show>

        <Show when={isLoading() && trackers().length > 0}>
          <div class="flex justify-center py-3">
            <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </Show>

        <div ref={setSentinel} class="h-1" />
      </div>

      {/* ── Status Bar (Excel-style footer) ── */}
      <div class="shrink-0 bg-card border-t border-border px-4 h-9 flex items-center justify-between text-[11px] select-none">
        <div class="flex items-center gap-4">
          <span class="text-muted-foreground">
            {trackers().length} rows{hasMore() ? "+" : ""}
          </span>
          <Show when={selectedIds().size > 0}>
            <span class="text-foreground font-medium">
              {selectedIds().size} selected
            </span>
          </Show>
        </div>
        <Show when={selectedIds().size > 0}>
          <div class="flex items-center gap-5">
            <div class="flex items-center gap-1.5">
              <span class="text-muted-foreground">Total Time:</span>
              <span class="font-semibold text-foreground tabular-nums">
                {formatTime(selectedTime())}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-muted-foreground">Total Earnings:</span>
              <span class="font-semibold text-primary tabular-nums">
                ${selectedEarnings().toFixed(2)}
              </span>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
