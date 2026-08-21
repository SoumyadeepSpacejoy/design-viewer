import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import {
  fetchAnalyticsOrders,
  fetchAnalyticsStats,
  fetchMonthlyBreakdown,
} from "~/lib/clientApi";
import type {
  AnalyticsOrder,
  AnalyticsStats,
  MonthlyBreakdown,
} from "~/lib/types";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderAnalytics() {
  const [orders, setOrders] = createSignal<AnalyticsOrder[]>([]);
  const [stats, setStats] = createSignal<AnalyticsStats | null>(null);
  const [monthly, setMonthly] = createSignal<MonthlyBreakdown[]>([]);
  const [total, setTotal] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [chartLoading, setChartLoading] = createSignal(false);
  const [startDate, setStartDate] = createSignal("");
  const [endDate, setEndDate] = createSignal("");
  const [selectedYear, setSelectedYear] = createSignal(new Date().getFullYear());
  const [activePreset, setActivePreset] = createSignal<string | null>(null);
  let skipRef = 0;
  const limit = 20;
  const [sentinel, setSentinel] = createSignal<HTMLDivElement>();
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>();

  const loadData = async (start: string, end: string, reset: boolean = true) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    const currentSkip = reset ? 0 : skipRef;

    try {
      const [ordersRes, statsRes, monthlyRes] = await Promise.all([
        fetchAnalyticsOrders(start, end, currentSkip, limit),
        reset ? fetchAnalyticsStats(start, end) : Promise.resolve(null),
        reset ? fetchMonthlyBreakdown(selectedYear()) : Promise.resolve(null),
      ]);

      if (reset) {
        setOrders(ordersRes.orders);
        if (statsRes) setStats(statsRes);
        if (monthlyRes) setMonthly(monthlyRes);
      } else {
        setOrders((prev) => [...prev, ...ordersRes.orders]);
      }
      setTotal(ordersRes.total);
      skipRef = currentSkip + limit;
    } catch (error) {
      console.error("Analytics load error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  onMount(() => {
    loadData("", "");
  });

  // Infinite scroll
  createEffect(() => {
    const sentinelEl = sentinel();
    const containerEl = scrollContainer();
    if (!sentinelEl || !containerEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore() && orders().length < total()) {
          loadData(startDate(), endDate(), false);
        }
      },
      { root: containerEl, threshold: 0.1 },
    );
    observer.observe(sentinelEl);
    onCleanup(() => observer.disconnect());
  });

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const handlePreset = (preset: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let start: Date, end: Date;

    if (activePreset() === preset) {
      setActivePreset(null);
      setStartDate("");
      setEndDate("");
      skipRef = 0;
      loadData("", "");
      return;
    }

    switch (preset) {
      case "this-month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last-month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this-quarter": {
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), q * 3 + 3, 0);
        break;
      }
      case "this-year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    const s = formatDate(start);
    const e = formatDate(end);
    setActivePreset(preset);
    setStartDate(s);
    setEndDate(e);
    skipRef = 0;
    loadData(s, e);
  };

  const handleDateRangeChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
    setActivePreset(null);
    if (s && e) {
      skipRef = 0;
      loadData(s, e);
    } else if (!s && !e) {
      skipRef = 0;
      loadData("", "");
    }
  };

  const maxRevenue = () => Math.max(...monthly().map((m) => m.revenue), 1);

  return (
    <Show
      when={!(isLoading() && !stats())}
      fallback={<PageLoader message="Loading analytics..." />}
    >
      <div
        class="animate-fade-in -m-4 sm:-m-6 lg:-m-8 flex flex-col"
        style={{ height: "calc(100vh - 56px)" }}
      >
        {/* ── Toolbar ── */}
        <div class="shrink-0 bg-card border-b border-border px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <h1 class="text-sm font-semibold text-foreground whitespace-nowrap mr-2">
            Design Order Analytics
          </h1>

          {/* Presets */}
          <div class="flex items-center gap-1">
            <For
              each={[
                { key: "this-month", label: "This Month" },
                { key: "last-month", label: "Last Month" },
                { key: "this-quarter", label: "Quarter" },
                { key: "this-year", label: "Year" },
              ]}
            >
              {(p) => (
                <button
                  onClick={() => handlePreset(p.key)}
                  class={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    activePreset() === p.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              )}
            </For>
          </div>

          <DateRangePicker
            startDate={startDate()}
            endDate={endDate()}
            onRangeChange={handleDateRangeChange}
          />

          {/* Year selector for monthly chart */}
          <div class="ml-auto flex items-center gap-1.5">
            <span class="text-[11px] text-muted-foreground">Chart year:</span>
            <select
              value={selectedYear()}
              onChange={async (e) => {
                const yr = parseInt(e.currentTarget.value);
                setSelectedYear(yr);
                setChartLoading(true);
                setMonthly([]);
                try {
                  setMonthly(await fetchMonthlyBreakdown(yr));
                } finally {
                  setChartLoading(false);
                }
              }}
              class="h-7 w-20 text-xs px-2 bg-secondary border border-border rounded-md text-foreground outline-none cursor-pointer"
            >
              <For each={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)}>
                {(y) => <option value={y}>{y}</option>}
              </For>
            </select>
          </div>
        </div>

        {/* ── Content (scrollable) ── */}
        <div ref={setScrollContainer} class="flex-1 overflow-y-auto min-h-0">
          <div class="p-4 sm:p-6 space-y-5">
            {/* ── Stat Cards ── */}
            <Show when={stats()}>
              {(s) => (
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div class="card p-4">
                    <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                      Total Orders
                    </p>
                    <p class="text-2xl font-semibold text-foreground tabular-nums">
                      {s().totalOrders.toLocaleString()}
                    </p>
                  </div>
                  <div class="card p-4">
                    <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                      Revenue
                    </p>
                    <p class="text-2xl font-semibold text-foreground tabular-nums">
                      {formatCurrency(s().totalRevenue)}
                    </p>
                  </div>
                  <div class="card p-4">
                    <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                      Discounts Given
                    </p>
                    <p class="text-2xl font-semibold text-foreground tabular-nums">
                      {formatCurrency(s().totalDiscount)}
                    </p>
                  </div>
                  <div class="card p-4">
                    <p class="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                      Avg Order Value
                    </p>
                    <p class="text-2xl font-semibold text-foreground tabular-nums">
                      {formatCurrency(s().avgOrderValue)}
                    </p>
                  </div>
                </div>
              )}
            </Show>

            {/* ── Monthly Bar Chart ── */}
            <Show when={monthly().length > 0 || chartLoading()}>
              <div class="card p-5">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-sm font-semibold text-foreground">
                    Monthly Revenue — {selectedYear()}
                  </h2>
                  <p class="text-xs text-muted-foreground tabular-nums">
                    {monthly().reduce((s, m) => s + m.orders, 0)} orders total
                  </p>
                </div>
                <Show
                  when={!chartLoading()}
                  fallback={
                    <div class="flex items-center justify-center" style={{ height: "160px" }}>
                      <div class="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
                    </div>
                  }
                >
                  <div class="flex items-end gap-1.5" style={{ height: "160px" }}>
                    <For each={monthly()}>
                      {(m, idx) => {
                        const heightPx = () =>
                          maxRevenue() > 0
                            ? Math.max((m.revenue / maxRevenue()) * 140, m.revenue > 0 ? 6 : 2)
                            : 2;
                        const barColor = () =>
                          m.revenue === 0
                            ? "bg-muted"
                            : m.revenue >= maxRevenue() * 0.75
                              ? "bg-emerald-500 group-hover:bg-emerald-400"
                              : m.revenue >= maxRevenue() * 0.4
                                ? "bg-blue-500 group-hover:bg-blue-400"
                                : "bg-amber-500 group-hover:bg-amber-400";
                        return (
                          <div class="flex-1 flex flex-col items-center justify-end h-full group">
                            {/* Tooltip */}
                            <div class="relative mb-1">
                              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 bg-foreground text-background text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none tabular-nums shadow-lg">
                                <span class="font-medium">{formatCurrency(m.revenue)}</span>
                                <span class="text-background/60 ml-1.5">{m.orders} orders</span>
                              </div>
                            </div>
                            {/* Bar */}
                            <div
                              class={`w-full max-w-8 rounded-t-md chart-bar-rise ${barColor()}`}
                              style={{
                                "--bar-height": `${heightPx()}px`,
                                "animation-delay": `${idx() * 60}ms`,
                              }}
                            />
                            {/* Label */}
                            <span class="text-[10px] text-muted-foreground mt-2 shrink-0">
                              {MONTH_NAMES[m.month - 1]}
                            </span>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </Show>

            {/* ── Orders Table ── */}
            <div class="card overflow-hidden">
              <div class="bg-muted/60 border-b border-border flex items-center px-4 h-9 text-[11px] font-semibold text-muted-foreground select-none">
                <div class="w-[180px] shrink-0">Customer</div>
                <div class="flex-1 min-w-0 hidden md:block">Package</div>
                <div class="w-[90px] hidden lg:block">Country</div>
                <div class="w-[80px] text-right hidden sm:block">Rooms</div>
                <div class="w-[100px] text-right hidden sm:block">Discount</div>
                <div class="w-[100px] text-right">Amount</div>
                <div class="w-[100px] text-right hidden lg:block">Date</div>
              </div>

              <div>
                <For each={orders()}>
                  {(order, index) => {
                    const customerName = () =>
                      order.customer?.profile?.name || order.customer?.email || "Unknown";
                    const customerEmail = () => order.customer?.email || "—";
                    const packageName = () => order.items?.[0]?.name || "—";

                    return (
                      <div
                        class={`flex items-center px-4 h-10 border-b border-border/60 text-[13px] ${
                          index() % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                      >
                        <div class="w-[180px] shrink-0 min-w-0">
                          <p class="text-sm text-foreground truncate">{customerName()}</p>
                          <p class="text-[10px] text-muted-foreground truncate">
                            {customerEmail()}
                          </p>
                        </div>
                        <div class="flex-1 min-w-0 hidden md:block">
                          <p class="text-sm text-foreground truncate">{packageName()}</p>
                        </div>
                        <div class="w-[90px] hidden lg:block">
                          <span class="text-xs text-muted-foreground">
                            {order.country || "—"}
                          </span>
                        </div>
                        <div class="w-[80px] text-right hidden sm:block">
                          <span class="text-sm text-foreground tabular-nums">
                            {order.totalrooms || 1}
                          </span>
                        </div>
                        <div class="w-[100px] text-right hidden sm:block">
                          <span class="text-sm text-muted-foreground tabular-nums">
                            {order.discount > 0 ? formatCurrency(order.discount) : "—"}
                          </span>
                        </div>
                        <div class="w-[100px] text-right">
                          <span class="text-sm font-medium text-foreground tabular-nums">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                        <div class="w-[100px] text-right hidden lg:block">
                          <span class="text-xs text-muted-foreground tabular-nums">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </For>

                <Show when={orders().length === 0 && !isLoading()}>
                  <div class="py-16 text-center text-sm text-muted-foreground">
                    No orders found for the selected period
                  </div>
                </Show>

                <Show when={isLoadingMore()}>
                  <div class="flex justify-center py-4">
                    <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                </Show>

                <div ref={setSentinel} class="h-1" />
              </div>

              {/* Footer */}
              <div class="bg-card border-t border-border px-4 h-9 flex items-center justify-between text-[11px] select-none">
                <span class="text-muted-foreground">
                  {orders().length} of {total()} orders
                </span>
                <Show when={orders().length > 0}>
                  <span class="text-muted-foreground tabular-nums">
                    Page total:{" "}
                    {formatCurrency(orders().reduce((s, o) => s + o.totalAmount, 0))}
                  </span>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
