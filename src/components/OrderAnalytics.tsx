"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnalyticsOrder, AnalyticsStats, MonthlyBreakdown } from "@/app/types";
import { fetchAnalyticsOrders, fetchAnalyticsStats, fetchMonthlyBreakdown } from "@/app/clientApi";
import DateRangePicker from "./DateRangePicker";
import PageLoader from "./PageLoader";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderAnalytics() {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyBreakdown[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const skipRef = useRef(0);
  const limit = 20;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(async (start: string, end: string, reset: boolean = true) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    const currentSkip = reset ? 0 : skipRef.current;

    try {
      const [ordersRes, statsRes, monthlyRes] = await Promise.all([
        fetchAnalyticsOrders(start, end, currentSkip, limit),
        reset ? fetchAnalyticsStats(start, end) : Promise.resolve(null),
        reset ? fetchMonthlyBreakdown(selectedYear) : Promise.resolve(null),
      ]);

      if (reset) {
        setOrders(ordersRes.orders);
        if (statsRes) setStats(statsRes);
        if (monthlyRes) setMonthly(monthlyRes);
      } else {
        setOrders((prev) => [...prev, ...ordersRes.orders]);
      }
      setTotal(ordersRes.total);
      skipRef.current = currentSkip + limit;
    } catch (error) {
      console.error("Analytics load error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData("", "");
  }, [loadData]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && orders.length < total) {
          loadData(startDate, endDate, false);
        }
      },
      { root: scrollContainer, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [orders.length, total, isLoadingMore, startDate, endDate, loadData]);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const handlePreset = (preset: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let start: Date, end: Date;

    if (activePreset === preset) {
      setActivePreset(null);
      setStartDate("");
      setEndDate("");
      skipRef.current = 0;
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
      case "this-quarter":
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), q * 3 + 3, 0);
        break;
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
    skipRef.current = 0;
    loadData(s, e);
  };

  const handleDateRangeChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
    setActivePreset(null);
    if (s && e) {
      skipRef.current = 0;
      loadData(s, e);
    } else if (!s && !e) {
      skipRef.current = 0;
      loadData("", "");
    }
  };

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  if (isLoading && !stats) {
    return <PageLoader message="Loading analytics..." />;
  }

  return (
    <div className="animate-fade-in -m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Toolbar ── */}
      <div className="shrink-0 bg-card border-b border-border px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <h1 className="text-sm font-semibold text-foreground whitespace-nowrap mr-2">Design Order Analytics</h1>

        {/* Presets */}
        <div className="flex items-center gap-1">
          {[
            { key: "this-month", label: "This Month" },
            { key: "last-month", label: "Last Month" },
            { key: "this-quarter", label: "Quarter" },
            { key: "this-year", label: "Year" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activePreset === p.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <DateRangePicker startDate={startDate} endDate={endDate} onRangeChange={handleDateRangeChange} />

        {/* Year selector for monthly chart */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Chart year:</span>
          <select
            value={selectedYear}
            onChange={async (e) => {
              const yr = parseInt(e.target.value);
              setSelectedYear(yr);
              setChartLoading(true);
              setMonthly([]);
              try {
                const data = await fetchMonthlyBreakdown(yr);
                setMonthly(data);
              } finally {
                setChartLoading(false);
              }
            }}
            className="h-7 w-20 text-xs px-2 bg-secondary border border-border rounded-md text-foreground outline-none cursor-pointer"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content (scrollable) ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 sm:p-6 space-y-5">

          {/* ── Stat Cards ── */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="card p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Total Orders</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{stats.totalOrders.toLocaleString()}</p>
              </div>
              <div className="card p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Revenue</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="card p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Discounts Given</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(stats.totalDiscount)}</p>
              </div>
              <div className="card p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Avg Order Value</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
            </div>
          )}

          {/* ── Monthly Bar Chart ── */}
          {(monthly.length > 0 || chartLoading) && (
            <div className="card p-5" key={`chart-${selectedYear}-${monthly.map(m => m.revenue).join(",")}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Monthly Revenue — {selectedYear}</h2>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {monthly.reduce((s, m) => s + m.orders, 0)} orders total
                </p>
              </div>
              {chartLoading ? (
                <div className="flex items-center justify-center" style={{ height: 160 }}>
                  <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
                </div>
              ) : (
              <div className="flex items-end gap-1.5" style={{ height: 160 }}>
                {monthly.map((m, idx) => {
                  const heightPx = maxRevenue > 0 ? Math.max((m.revenue / maxRevenue) * 140, m.revenue > 0 ? 6 : 2) : 2;
                  const barColor = m.revenue === 0
                    ? "bg-muted"
                    : m.revenue >= maxRevenue * 0.75
                      ? "bg-emerald-500 group-hover:bg-emerald-400"
                      : m.revenue >= maxRevenue * 0.4
                        ? "bg-blue-500 group-hover:bg-blue-400"
                        : "bg-amber-500 group-hover:bg-amber-400";
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                      {/* Tooltip */}
                      <div className="relative mb-1">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 bg-foreground text-background text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none tabular-nums shadow-lg">
                          <span className="font-medium">{formatCurrency(m.revenue)}</span>
                          <span className="text-background/60 ml-1.5">{m.orders} orders</span>
                        </div>
                      </div>
                      {/* Bar */}
                      <div
                        className={`w-full max-w-8 rounded-t-md chart-bar-rise ${barColor}`}
                        style={{
                          "--bar-height": `${heightPx}px`,
                          animationDelay: `${idx * 60}ms`,
                        } as React.CSSProperties}
                      />
                      {/* Label */}
                      <span className="text-[10px] text-muted-foreground mt-2 shrink-0">{MONTH_NAMES[m.month - 1]}</span>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ── Orders Table ── */}
          <div className="card overflow-hidden">
            <div className="bg-muted/60 border-b border-border flex items-center px-4 h-9 text-[11px] font-semibold text-muted-foreground select-none">
              <div className="w-[180px] shrink-0">Customer</div>
              <div className="flex-1 min-w-0 hidden md:block">Package</div>
              <div className="w-[90px] hidden lg:block">Country</div>
              <div className="w-[80px] text-right hidden sm:block">Rooms</div>
              <div className="w-[100px] text-right hidden sm:block">Discount</div>
              <div className="w-[100px] text-right">Amount</div>
              <div className="w-[100px] text-right hidden lg:block">Date</div>
            </div>

            <div>
              {orders.map((order, index) => {
                const customerName = order.customer?.profile?.name || order.customer?.email || "Unknown";
                const customerEmail = order.customer?.email || "—";
                const pkg = order.items?.[0];
                const packageName = pkg?.name || "—";

                return (
                  <div
                    key={order._id}
                    className={`flex items-center px-4 h-10 border-b border-border/60 text-[13px] ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <div className="w-[180px] shrink-0 min-w-0">
                      <p className="text-sm text-foreground truncate">{customerName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{customerEmail}</p>
                    </div>
                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="text-sm text-foreground truncate">{packageName}</p>
                    </div>
                    <div className="w-[90px] hidden lg:block">
                      <span className="text-xs text-muted-foreground">{order.country || "—"}</span>
                    </div>
                    <div className="w-[80px] text-right hidden sm:block">
                      <span className="text-sm text-foreground tabular-nums">{order.totalrooms || 1}</span>
                    </div>
                    <div className="w-[100px] text-right hidden sm:block">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {order.discount > 0 ? formatCurrency(order.discount) : "—"}
                      </span>
                    </div>
                    <div className="w-[100px] text-right">
                      <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div className="w-[100px] text-right hidden lg:block">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && !isLoading && (
                <div className="py-16 text-center text-sm text-muted-foreground">No orders found for the selected period</div>
              )}

              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}

              <div ref={sentinelRef} className="h-1" />
            </div>

            {/* Footer */}
            <div className="bg-card border-t border-border px-4 h-9 flex items-center justify-between text-[11px] select-none">
              <span className="text-muted-foreground">
                {orders.length} of {total} orders
              </span>
              {orders.length > 0 && (
                <span className="text-muted-foreground tabular-nums">
                  Page total: {formatCurrency(orders.reduce((s, o) => s + o.totalAmount, 0))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
