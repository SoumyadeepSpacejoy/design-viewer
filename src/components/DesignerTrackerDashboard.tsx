"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AdminTimeTracker } from "@/app/types";
import { searchAdminTimeTrackers } from "@/app/clientApi";

interface DesignerTrackerDashboardProps {
  onSelect?: (id: string | null, name?: string) => void;
}

export default function DesignerTrackerDashboard({
  onSelect,
}: DesignerTrackerDashboardProps) {
  const [trackers, setTrackers] = useState<AdminTimeTracker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);

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

  const loadTrackers = useCallback(
    async (search: string, reset: boolean = false) => {
      setIsLoading(true);
      try {
        const currentSkip = reset ? 0 : skip;
        const data = await searchAdminTimeTrackers(search, currentSkip, limit);
        if (reset) {
          setTrackers(data);
          setSkip(limit);
        } else {
          setTrackers((prev) => [...prev, ...data]);
          setSkip(currentSkip + limit);
        }
      } catch (error) {
        console.error("Error loading trackers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [skip],
  );

  useEffect(() => {
    if (hasLoadedInitial.current) return;
    hasLoadedInitial.current = true;
    loadTrackers("", true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      loadTrackers(value, true);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-scale">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-thin text-pink-100 uppercase tracking-tight mb-2 text-pink-shadow">
            Designer{" "}
            <span className="text-pink-400 font-light">Performance</span>
          </h2>
          <p className="text-pink-300/40 text-xs font-bold uppercase tracking-[0.2em]">
            MONITOR WORKLOADS AND EARNINGS
          </p>
        </div>

        <div className="relative group max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-pink-500/40 group-focus-within:text-pink-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-pink-500/10 rounded-2xl text-pink-100 placeholder-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all duration-300 glass-panel"
            placeholder="Search by designer name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trackers.map((tracker) => (
          <div
            key={tracker._id}
            className="group relative bg-black/40 rounded-[2rem] p-8 border border-pink-500/10 shadow-2xl hover:border-pink-500/30 transition-all duration-500 glass-panel flex flex-col cursor-pointer"
            onClick={() =>
              onSelect?.(
                String(tracker._id),
                `${tracker.designer.profile.name}: ${tracker.project.name}`,
              )
            }
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-900/40 border border-pink-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-pink-400">
                    {tracker.designer.profile.firstName[0]}
                    {tracker.designer.profile.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-pink-100 font-light group-hover:text-pink-400 transition-colors">
                    {tracker.designer.profile.name}
                  </h4>
                  <p className="text-[10px] text-pink-300/40 uppercase tracking-widest">
                    Designer
                  </p>
                </div>
              </div>
              {tracker.overTime.isOverTime && (
                <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500 uppercase font-bold tracking-tighter">
                  Overtime
                </span>
              )}
            </div>

            <div className="mb-6 pb-6 border-b border-pink-500/5">
              <h5 className="text-xs font-bold text-pink-500/60 uppercase tracking-widest mb-1">
                Project
              </h5>
              <p className="text-pink-100 text-sm font-light">
                {tracker.project.name}
              </p>
              <p className="text-[10px] text-pink-300/40 uppercase mt-1">
                Client: {tracker.project.customerName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-[10px] font-bold text-pink-500/60 uppercase tracking-widest mb-1">
                  Time Spent
                </p>
                <p className="text-pink-100 font-light tabular-nums">
                  {formatTime(tracker.totalTimeSpend)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-pink-500/60 uppercase tracking-widest mb-1">
                  Earnings
                </p>
                <p className="text-pink-400 font-bold tabular-nums">
                  ${tracker.earnings.toFixed(2)}
                </p>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold text-pink-500/60 uppercase tracking-widest mb-1">
                  Hourly Rate
                </p>
                <p className="text-pink-300/40 text-xs">
                  ${tracker.hourlyRate}/hr
                </p>
              </div>
              <div className="mt-2 text-right">
                <p className="text-[10px] font-bold text-pink-500/60 uppercase tracking-widest mb-1">
                  Budget
                </p>
                <p className="text-pink-300/40 text-xs">${tracker.budget}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-pink-500/5 text-center">
              <span className="text-[9px] font-bold text-pink-500/40 uppercase tracking-[0.2em] group-hover:text-pink-400 transition-colors">
                View Task Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {isLoading && trackers.length === 0 && (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && trackers.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-3xl border border-pink-500/10">
          <p className="text-pink-300/40 uppercase tracking-widest text-sm">
            No performance data found.
          </p>
        </div>
      )}
    </div>
  );
}
