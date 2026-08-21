import { createSignal, For, Show } from "solid-js";
import DateRangePicker from "./DateRangePicker";

interface SearchFilterBarProps {
  onSearch: (text: string, date: { start: string; end: string }, type?: string) => void;
  placeholder?: string;
}

export default function SearchFilterBar(props: SearchFilterBarProps) {
  const [text, setText] = createSignal("");
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");
  const [activeRange, setActiveRange] = createSignal<string | null>(null);
  const [showFilters, setShowFilters] = createSignal(false);

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

  const handleApply = () => {
    props.onSearch(
      text(),
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
    props.onSearch(text(), newDates, newRange || undefined);
  };

  const handleReset = () => {
    setText("");
    setStartDate("");
    setEndDate("");
    setActiveRange(null);
    props.onSearch("", { start: "", end: "" });
  };

  return (
    <div class="space-y-3 relative z-30">
      <div class="flex gap-2 items-center">
        {/* Search input */}
        <div class="relative flex-1 min-w-0">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="input h-9 text-sm"
            style={{ "padding-left": "2.5rem" }}
            placeholder={props.placeholder ?? "Search..."}
            value={text()}
            onInput={(e) => setText(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters())}
          class={`h-9 w-9 flex items-center justify-center rounded-lg border border-border transition-colors shrink-0 ${
            showFilters()
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="Filters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>

        <button onClick={handleApply} class="btn btn-primary btn-sm h-9">
          Search
        </button>
      </div>

      {/* Expandable filters */}
      <Show when={showFilters()}>
        <div class="card p-4 space-y-3 animate-fade-in relative z-40">
          {/* Quick presets */}
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-muted-foreground mr-1">Period:</span>
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
          </div>

          {/* Calendar date range picker */}
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-muted-foreground">Custom:</span>
            <DateRangePicker
              startDate={startDate()}
              endDate={endDate()}
              onRangeChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                setActiveRange(null);
                if (s && e) {
                  props.onSearch(text(), { start: s, end: e });
                } else if (!s && !e) {
                  props.onSearch(text(), { start: "", end: "" });
                }
              }}
            />
            <button onClick={handleReset} class="btn btn-ghost btn-sm text-xs ml-auto">
              Reset
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
