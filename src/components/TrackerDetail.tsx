"use client";

import { useEffect, useState } from "react";
import { TimeTracker, TimeTrackerState } from "@/app/types";
import {
  fetchTimeTrackerStates,
  endTimeTrackerState,
  fetchTimeTracker,
} from "@/app/clientApi";
import CreateTaskModal from "./CreateTaskModal";

interface TrackerDetailProps {
  tracker: TimeTracker;
  onBack: () => void;
}

export default function TrackerDetail({
  tracker: initialTracker,
  onBack,
}: TrackerDetailProps) {
  const [tracker, setTracker] = useState<TimeTracker>(initialTracker);
  const [tasks, setTasks] = useState<TimeTrackerState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEndingTask, setIsEndingTask] = useState<string | null>(null);

  const loadTracker = async () => {
    try {
      const updatedTracker = await fetchTimeTracker(tracker._id);
      if (updatedTracker) setTracker(updatedTracker);
    } catch (error) {
      console.error("Error refreshing tracker:", error);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTimeTrackerStates(tracker._id);
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTracker(initialTracker);
    loadTasks();
  }, [initialTracker._id]);

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    loadTasks(); // Refresh the tasks list
    loadTracker(); // Refresh summary cards
  };

  const handleEndTask = async (stateId: string) => {
    setIsEndingTask(stateId);
    try {
      await endTimeTrackerState(stateId);
      // Refresh both tasks and tracker summary to reflect the updated duration/status
      await Promise.all([loadTasks(), loadTracker()]);
    } catch (error) {
      console.error("Error ending task:", error);
      alert("Failed to end task. Please try again.");
    } finally {
      setIsEndingTask(null);
    }
  };

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeRemaining = tracker.maximumTimeSeconds - tracker.totalTimeSpend;
  const isOvertime = timeRemaining < 0;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-scale">
      {/* Header Info Card */}
      <div className="mb-8">
        <div className="glass-panel rounded-2xl border border-pink-500/10 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-light text-pink-100 mb-4">
            {tracker.project.customerName}'s {tracker.project.name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-pink-300/40 text-xs uppercase tracking-wider">
                  Time Spent
                </p>
                <p className="text-blue-400 font-medium text-lg">
                  {formatTime(tracker.totalTimeSpend)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  isOvertime
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-green-500/10 border-green-500/20"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    isOvertime ? "text-red-400" : "text-green-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-pink-300/40 text-xs uppercase tracking-wider">
                  {isOvertime ? "Overtime" : "Remaining"}
                </p>
                <p
                  className={`font-medium text-lg ${
                    isOvertime ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isOvertime
                    ? formatTime(Math.abs(timeRemaining))
                    : formatTime(timeRemaining)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <svg
                  className="w-5 h-5 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-pink-300/40 text-xs uppercase tracking-wider">
                  Maximum
                </p>
                <p className="text-pink-400 font-medium text-lg">
                  {formatTime(tracker.maximumTimeSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-light text-pink-100">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-sm font-bold uppercase tracking-widest transition-all group"
        >
          <svg
            className="w-4 h-4 transform group-hover:rotate-90 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Task
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="glass-panel rounded-2xl border border-pink-500/10 p-6 hover:border-pink-500/20 transition-all"
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <svg
                        className="w-3.5 h-3.5 text-pink-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <h3 className="text-sm font-bold text-pink-100 uppercase tracking-wider">
                        {task.tag}
                      </h3>
                    </div>
                    {!task.endTime && (
                      <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs font-medium">
                        In Progress
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-pink-300/40 text-xs uppercase tracking-wider mb-1">
                        Started
                      </p>
                      <p className="text-pink-100">
                        {formatDateTime(task.startTime)}
                      </p>
                    </div>

                    {task.endTime && (
                      <div>
                        <p className="text-pink-300/40 text-xs uppercase tracking-wider mb-1">
                          Ended
                        </p>
                        <p className="text-pink-100">
                          {formatDateTime(task.endTime)}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-pink-300/40 text-xs uppercase tracking-wider mb-1">
                        Duration
                      </p>
                      <p className="text-pink-400 font-medium">
                        {formatTime(task.duration)}
                      </p>
                    </div>
                  </div>

                  {task.note && (
                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-pink-500/10 group/note">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-3.5 h-3.5 text-pink-400/60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="text-[10px] font-bold text-pink-400/40 uppercase tracking-[0.2em]">
                          Task Note
                        </span>
                      </div>
                      <p className="text-pink-300/70 text-sm leading-relaxed whitespace-pre-wrap">
                        {task.note}
                      </p>
                    </div>
                  )}
                </div>

                {!task.endTime && (
                  <button
                    onClick={() => handleEndTask(task._id)}
                    disabled={isEndingTask === task._id}
                    className="shrink-0 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-pink-400 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isEndingTask === task._id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-pink-400/20 border-t-pink-400 rounded-full animate-spin"></div>
                        Ending...
                      </div>
                    ) : (
                      "End Task"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-panel rounded-2xl border border-pink-500/10">
          <p className="text-pink-300/40 text-sm">
            No tasks yet. Create your first task to get started.
          </p>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trackerId={tracker._id}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
