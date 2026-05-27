"use client";

import { useState } from "react";
import DateRangePicker from "./DateRangePicker";

interface ReportCardConfig {
  id: string;
  title: string;
  description: string;
  filename: (start: string, end: string) => string;
  fetchCsv: (start: string, end: string) => Promise<Response>;
}

const REPORTS: ReportCardConfig[] = [
  {
    id: "design-ready",
    title: "Design Ready Data",
    description:
      "Customers whose designs were marked ready in the selected period but who have not purchased. Includes designer, project form answers and design assets.",
    filename: (start, end) => `design-ready-${start}-${end}.csv`,
    fetchCsv: async (start, end) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      return fetch("https://apiv2.spacejoy.com/v1/report/design-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ start, end, format: "csv" }),
      });
    },
  },
];

function ReportCard({ config }: { config: ReportCardConfig }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRangeChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError("Select a start and end date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await config.fetchCsv(startDate, endDate);
      if (!response.ok) {
        throw new Error(`Failed to generate report (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = config.filename(startDate, endDate);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !startDate || !endDate;

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {config.description}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Date range
        </span>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
          align="left"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-end pt-1">
        <button
          onClick={handleGenerate}
          disabled={disabled}
          className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Generate CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and download CSV reports for selected date ranges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => (
          <ReportCard key={report.id} config={report} />
        ))}
      </div>
    </div>
  );
}
