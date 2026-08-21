import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";
import { fetchDesignersList, fetchDesignerWork } from "~/lib/clientApi";
import type { DesignerWorkTracker } from "~/lib/types";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

interface Props {
  designerId: string;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts: string[] = [];
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

export default function DesignerWorkDetail(props: Props) {
  const [trackers, setTrackers] = createSignal<DesignerWorkTracker[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [activeRange, setActiveRange] = createSignal<string | null>(null);
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
  const [designerName, setDesignerName] = createSignal("");

  const load = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      setTrackers(await fetchDesignerWork(props.designerId, start, end));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(on(() => props.designerId, () => load("", "")));

  createEffect(
    on(
      () => props.designerId,
      async (designerId) => {
        try {
          const list = await fetchDesignersList();
          const match = list.find((d) => d._id === designerId);
          if (match?.name) setDesignerName(match.name);
        } catch (err) {
          console.error(err);
        }
      },
    ),
  );

  const handleRangeClick = (range: string) => {
    const isDeactivating = activeRange() === range;
    const newRange = isDeactivating ? null : range;
    setActiveRange(newRange);
    let newDates = { start: "", end: "" };
    if (newRange) newDates = calculateRange(newRange);
    setStartDate(newDates.start);
    setEndDate(newDates.end);
    load(newDates.start, newDates.end);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    load("", "");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totals = createMemo(() => ({
    time: trackers().reduce((sum, t) => sum + (t.timeWorked || 0), 0),
    earnings: trackers().reduce((sum, t) => sum + (t.earnings || 0), 0),
  }));

  const escapeCsv = (val: string | number | null | undefined) => {
    const str = val == null ? "" : String(val);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const handleDownloadCsv = () => {
    if (trackers().length === 0) return;
    const header = ["Designer", "Project", "Total Working Hours", "Earnings (USD)"];
    const rows = trackers().map((t) => [
      designerName() || "",
      t.projectName || "Untitled project",
      formatTime(t.timeWorked || 0),
      (t.earnings || 0).toFixed(2),
    ]);
    const totalsRow = ["Total", "", formatTime(totals().time), totals().earnings.toFixed(2)];
    const csv = [header, ...rows, totalsRow]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const periodLabel =
      startDate() && endDate()
        ? `${startDate()}_to_${endDate()}`
        : activeRange() || "all-time";
    const safeName = (designerName() || "designer")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    a.href = url;
    a.download = `${safeName}_work-report_${periodLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="space-y-5">
      <div>
        <h1 class="text-2xl font-semibold text-foreground tracking-tight">
          Designer Work Breakdown
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Filter by date range to see time and earnings per project for this designer.
        </p>
      </div>

      <div class="card p-4 flex flex-wrap items-center gap-3">
        <span class="text-xs text-muted-foreground">Period:</span>
        <For each={["daily", "weekly", "monthly", "yearly"]}>
          {(range) => (
            <button
              onClick={() => handleRangeClick(range)}
              class={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeRange() === range
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {range}
            </button>
          )}
        </For>
        <DateRangePicker
          startDate={startDate()}
          endDate={endDate()}
          onRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setActiveRange(null);
            if (s && e) load(s, e);
            else if (!s && !e) load("", "");
          }}
        />
        <div class="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleDownloadCsv}
            disabled={trackers().length === 0 || isLoading()}
            class="btn btn-ghost btn-sm text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download these results as CSV"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
          <Show when={startDate() || endDate() || activeRange()}>
            <button onClick={handleReset} class="btn btn-ghost btn-sm text-xs">
              Reset
            </button>
          </Show>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="text-xs text-muted-foreground">Total Time</p>
          <p class="text-xl font-semibold text-foreground tabular-nums mt-1">
            {formatTime(totals().time)}
          </p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-muted-foreground">Total Earnings</p>
          <p class="text-xl font-semibold text-primary tabular-nums mt-1">
            ${totals().earnings.toFixed(2)}
          </p>
        </div>
      </div>

      <Show when={!isLoading()} fallback={<PageLoader message="Loading work..." />}>
        <Show
          when={trackers().length > 0}
          fallback={
            <div class="card p-12 text-center">
              <p class="text-sm text-muted-foreground">No work in this period.</p>
            </div>
          }
        >
          <div class="space-y-3">
            <For each={trackers()}>
              {(tracker) => {
                const isOpen = () => expanded().has(tracker._id);
                return (
                  <div class="card overflow-hidden">
                    <button
                      onClick={() => toggleExpand(tracker._id)}
                      class="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-foreground truncate">
                          {tracker.projectName || "Untitled project"}
                        </p>
                        <Show when={tracker.customer}>
                          <p class="text-xs text-muted-foreground truncate">
                            {tracker.customer}
                          </p>
                        </Show>
                      </div>
                      <div class="text-right shrink-0">
                        <p class="text-sm font-semibold tabular-nums text-foreground">
                          {formatTime(tracker.timeWorked)}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {tracker.tasks.length}{" "}
                          {tracker.tasks.length === 1 ? "task" : "tasks"}
                        </p>
                      </div>
                      <div class="text-right shrink-0 w-24">
                        <p class="text-sm font-semibold tabular-nums text-primary">
                          ${tracker.earnings.toFixed(2)}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          ${tracker.hourlyRate}/hr
                        </p>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class={`text-muted-foreground transition-transform shrink-0 ${isOpen() ? "rotate-90" : ""}`}
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>

                    <Show when={isOpen()}>
                      <div class="border-t border-border bg-muted/20">
                        <Show
                          when={tracker.tasks.length > 0}
                          fallback={<p class="p-4 text-xs text-muted-foreground">No tasks.</p>}
                        >
                          <div class="divide-y divide-border/60">
                            <For each={tracker.tasks}>
                              {(task) => (
                                <div class="px-4 py-3 flex items-center gap-3 text-xs">
                                  <div class="flex-1 min-w-0">
                                    <p class="font-medium text-foreground truncate">
                                      {task.tag || "Untitled task"}
                                    </p>
                                    <Show when={task.note}>
                                      <p class="text-muted-foreground truncate mt-0.5">
                                        {task.note}
                                      </p>
                                    </Show>
                                    <p class="text-[11px] text-muted-foreground mt-0.5">
                                      {new Date(task.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span class="tabular-nums text-foreground shrink-0">
                                    {formatTime(task.totalDuration)}
                                  </span>
                                  <span class="tabular-nums text-primary shrink-0 w-20 text-right">
                                    $
                                    {((task.totalDuration / 3600) * tracker.hourlyRate).toFixed(2)}
                                  </span>
                                  <span
                                    class={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                                      task.status === "done"
                                        ? "bg-success/10 text-success"
                                        : task.status === "inProgress"
                                          ? "bg-primary/10 text-primary"
                                          : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                              )}
                            </For>
                          </div>
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
    </div>
  );
}
