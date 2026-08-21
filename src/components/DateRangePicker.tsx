import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  align?: "left" | "right";
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateRangePicker(props: DateRangePickerProps) {
  const [open, setOpen] = createSignal(false);
  const [viewDate, setViewDate] = createSignal(parseDate(props.startDate) || new Date());
  const [selecting, setSelecting] = createSignal<"start" | "end">("start");
  const [hoverDate, setHoverDate] = createSignal<Date | null>(null);
  let ref: HTMLDivElement | undefined;

  const start = () => parseDate(props.startDate);
  const end = () => parseDate(props.endDate);
  const align = () => props.align ?? "right";

  onMount(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref && !ref.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    onCleanup(() => document.removeEventListener("mousedown", handleClick));
  });

  const year = () => viewDate().getFullYear();
  const month = () => viewDate().getMonth();
  const firstDay = () => new Date(year(), month(), 1).getDay();
  const daysInMonth = () => new Date(year(), month() + 1, 0).getDate();
  const today = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const prevMonth = () => setViewDate(new Date(year(), month() - 1, 1));
  const nextMonth = () => setViewDate(new Date(year(), month() + 1, 1));

  const handleDayClick = (day: number) => {
    const clicked = new Date(year(), month(), day);
    if (selecting() === "start") {
      props.onRangeChange(toDateStr(clicked), "");
      setSelecting("end");
    } else {
      const s = start()!;
      if (clicked < s) {
        props.onRangeChange(toDateStr(clicked), toDateStr(s));
      } else {
        props.onRangeChange(toDateStr(s), toDateStr(clicked));
      }
      setSelecting("start");
    }
  };

  const getDayState = (day: number) => {
    const d = new Date(year(), month(), day);
    const s = start();
    const e = end();
    const isStart = s && isSameDay(d, s);
    const isEnd = e && isSameDay(d, e);

    let rangeStart = s;
    let rangeEnd = e;

    // If selecting end, use hover for preview
    const hover = hoverDate();
    if (selecting() === "end" && s && !e && hover) {
      rangeEnd = hover >= s ? hover : s;
      rangeStart = hover >= s ? s : hover;
    }

    const inRange = rangeStart && rangeEnd && d > rangeStart && d < rangeEnd;
    const isRangeStart = rangeStart && isSameDay(d, rangeStart);
    const isRangeEnd = rangeEnd && isSameDay(d, rangeEnd);
    const isToday = isSameDay(d, today());

    return { isStart, isEnd, inRange, isRangeStart, isRangeEnd, isToday };
  };

  const displayLabel = () => {
    if (props.startDate && props.endDate) {
      const s = parseDate(props.startDate)!;
      const e = parseDate(props.endDate)!;
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (props.startDate) {
      const s = parseDate(props.startDate)!;
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ...`;
    }
    return "Select dates";
  };

  return (
    <div class="relative z-50" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open())}
        class={`h-8 px-3 flex items-center gap-2 rounded-md border text-xs transition-colors ${
          open() || props.startDate
            ? "border-foreground/20 bg-secondary text-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <span class="whitespace-nowrap">{displayLabel()}</span>
        <Show when={props.startDate || props.endDate}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              props.onRangeChange("", "");
              setSelecting("start");
            }}
            class="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
          >
            ×
          </span>
        </Show>
      </button>

      {/* Calendar dropdown */}
      <Show when={open()}>
        <div class={`absolute top-full mt-2 ${align() === "left" ? "left-0 right-auto" : "right-0 left-auto"} z-50 card p-4 shadow-xl animate-fade-in w-[280px] max-w-[calc(100vw-2rem)]`}>
          {/* Month navigation */}
          <div class="flex items-center justify-between mb-3">
            <button onClick={prevMonth} class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span class="text-sm font-medium text-foreground">
              {MONTHS[month()]} {year()}
            </span>
            <button onClick={nextMonth} class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Selecting hint */}
          <p class="text-[11px] text-muted-foreground text-center mb-2">
            {selecting() === "start" ? "Select start date" : "Select end date"}
          </p>

          {/* Day names */}
          <div class="grid grid-cols-7 mb-1">
            <For each={DAYS}>
              {(d) => (
                <div class="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground">
                  {d}
                </div>
              )}
            </For>
          </div>

          {/* Day grid */}
          <div class="grid grid-cols-7">
            {/* Empty cells before first day */}
            <For each={Array.from({ length: firstDay() })}>{() => <div class="h-8" />}</For>

            <For each={Array.from({ length: daysInMonth() }, (_, i) => i + 1)}>
              {(day) => {
                const state = () => getDayState(day);
                const isEndpoint = () => state().isRangeStart || state().isRangeEnd;

                return (
                  <div
                    class={`relative h-8 flex items-center justify-center ${
                      state().inRange ? "bg-foreground/[0.06]" : ""
                    } ${state().isRangeStart ? "rounded-l-md bg-foreground/[0.06]" : ""} ${
                      state().isRangeEnd ? "rounded-r-md bg-foreground/[0.06]" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoverDate(new Date(year(), month(), day))}
                      onMouseLeave={() => setHoverDate(null)}
                      class={`w-8 h-8 rounded-md text-xs font-medium transition-colors relative z-10
                        ${
                          isEndpoint()
                            ? "bg-foreground text-background font-semibold"
                            : state().isToday
                              ? "border border-foreground/20 text-foreground"
                              : "text-foreground hover:bg-secondary"
                        }
                      `}
                    >
                      {day}
                    </button>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Footer */}
          <Show when={props.startDate || props.endDate}>
            <div class="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">{displayLabel()}</span>
              <button
                onClick={() => {
                  props.onRangeChange("", "");
                  setSelecting("start");
                }}
                class="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
