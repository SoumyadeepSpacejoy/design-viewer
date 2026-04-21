"use client";

import {
  AdminTimeTracker,
  AnalyticsOrder,
  AnalyticsStats,
  MonthlyBreakdown,
  Project,
  ProjectSearchResponse,
  TimeTracker,
  TimeTrackerSession,
  TimeTrackerState,
} from "./types";

function mapTimeTracker(data: any): TimeTracker {
  if (data.entryType === "manual") {
    return {
      ...data,
      project: {
        _id: data._id,
        name: data.manualProjectName || "Manual Task",
        customerName: "Internal",
      },
    } as TimeTracker;
  }
  return data as TimeTracker;
}

export async function searchProjects(
  skip: number = 0,
  limit: number = 20,
): Promise<ProjectSearchResponse> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const requestBody = {
      filters: {
        customerName: [],
        designerName: [],
        roomName: [],
        email: [],
        quizStatus: [],
        phase: ["requirement"],
        status: ["active"],
        country: "US",
        projectType: "all",
        startDate: {
          start: "",
          end: "",
        },
        delivery: {
          start: "",
          end: "",
        },
        pause: false,
        designPhase: [],
      },
      sort: {
        createdAt: -1,
      },
    };

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/project/search?limit=${limit}&skip=${skip}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching projects:", error);
    return { projects: [], count: 0 };
  }
}

export interface SearchedUser {
  _id: string;
  email: string;
  profile?: { name?: string };
  createdAt: string;
}

export interface SearchUsersResponse {
  users: SearchedUser[];
  total: number;
}

export async function searchUsers(params: {
  query?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}): Promise<SearchUsersResponse> {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const { query, startDate, endDate, limit = 20, skip = 0 } = params;

    const body: Record<string, unknown> = { limit, skip };
    if (query) body.query = query;
    if (startDate) body.startDate = new Date(startDate).toISOString();
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      body.endDate = end.toISOString();
    }

    const response = await fetch("https://apiv2.spacejoy.com/v1/user/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }

    return (await response.json()) as SearchUsersResponse;
  } catch (error) {
    console.error("Error searching users:", error);
    return { users: [], total: 0 };
  }
}

export interface PseudoLoginResult {
  token: string;
  user: { _id: string; email: string; name?: string; role?: string };
}

const PSEUDO_LOGIN_EMAIL = "admin@spacejoy.com";
const PSEUDO_LOGIN_PASSWORD = "bvS8xYu5Z8px7RsB";

export async function pseudoLoginAsUser(customerEmail: string): Promise<PseudoLoginResult> {
  const response = await fetch("https://api.spacejoy.com/api/auth/login/pseudo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: PSEUDO_LOGIN_EMAIL,
      password: PSEUDO_LOGIN_PASSWORD,
      customerEmail,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.data?.token) {
    throw new Error(data?.message || "Pseudo login failed");
  }
  return { token: data.data.token, user: data.data.user };
}

export async function fetchTimeTrackers(
  skip: number = 0,
  limit: number = 20,
): Promise<TimeTracker[]> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/designer?limit=${limit}&skip=${skip}`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch time trackers: ${response.statusText}`);
    }

    const data = await response.json();
    return (data as any[]).map(mapTimeTracker);
  } catch (error) {
    console.error("Error fetching time trackers:", error);
    return [];
  }
}

export async function fetchTimeTracker(
  trackerId: string,
): Promise<TimeTracker | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/${trackerId}`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch time tracker: ${response.statusText}`);
    }

    const data = await response.json();
    return mapTimeTracker(data);
  } catch (error) {
    console.error("Error fetching time tracker:", error);
    return null;
  }
}

export async function createTimeTrackerState(
  trackerId: string,
  tag: string,
  note: string = "",
): Promise<TimeTrackerState | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      "https://apiv2.spacejoy.com/v1/time-tracker/state",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          tracker: trackerId,
          tag,
          note,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerState;
  } catch (error) {
    console.error("Error creating time tracker state:", error);
    throw error;
  }
}

export async function fetchTimeTrackerStates(
  trackerId: string,
): Promise<TimeTrackerState[]> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/${trackerId}/state`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerState[];
  } catch (error) {
    console.error("Error fetching time tracker states:", error);
    return [];
  }
}

export async function fetchTaskSessions(
  taskId: string,
): Promise<TimeTrackerSession[]> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/task/${taskId}/sessions`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch task sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerSession[];
  } catch (error) {
    console.error("Error fetching task sessions:", error);
    return [];
  }
}

export async function updateTaskStatus(
  taskId: string,
  type: "done" | "pause",
): Promise<TimeTrackerState | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/task/${taskId}/${type}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerState;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

export async function resumeTask(
  taskId: string,
): Promise<TimeTrackerState | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/task/${taskId}/resume/session`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to resume task: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerState;
  } catch (error) {
    console.error("Error resuming task:", error);
    throw error;
  }
}

export async function endTimeTrackerState(
  stateId: string,
): Promise<TimeTrackerState | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/state/${stateId}/end`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to end task: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TimeTrackerState;
  } catch (error) {
    console.error("Error ending time tracker state:", error);
    throw error;
  }
}

export async function searchAdminTimeTrackers(
  text: string = "",
  date: { start: string; end: string } = { start: "", end: "" },
  skip: number = 0,
  limit: number = 10,
  filterType?: string,
): Promise<AdminTimeTracker[]> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/admin?limit=${limit}&skip=${skip}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          query: {
            text,
            date,
            type: filterType,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch admin time trackers: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data as AdminTimeTracker[];
  } catch (error) {
    console.error("Error switching to admin time trackers:", error);
    return [];
  }
}

export async function updateOvertimeReason(
  trackerId: string,
  reason: string,
): Promise<TimeTracker | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `https://apiv2.spacejoy.com/v1/time-tracker/${trackerId}/overTime/reason`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          reason,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update overtime reason: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return mapTimeTracker(data);
  } catch (error) {
    console.error("Error updating overtime reason:", error);
    throw error;
  }
}

export async function updateManualTime(
  projectId: string,
  timeInSeconds: number,
): Promise<any> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      "https://apiv2.spacejoy.com/v1/time-tracker/update-time/manual",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          project: projectId,
          time: timeInSeconds,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update manual time: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating manual time:", error);
    throw error;
  }
}
export async function updateTaskTime(
  taskId: string,
  timeInSeconds: number,
): Promise<any> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      "https://apiv2.spacejoy.com/v1/time-tracker/update-time/task",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          task: taskId,
          time: timeInSeconds,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update task time: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating task time:", error);
    throw error;
  }
}
export async function createProjectTracker(
  projectId: string,
): Promise<AdminTimeTracker | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("https://apiv2.spacejoy.com/v1/time-tracker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ project: projectId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tracker: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AdminTimeTracker;
  } catch (error) {
    console.error("Error creating project tracker:", error);
    return null;
  }
}

export async function createPersonalTracker(): Promise<AdminTimeTracker | null> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      "https://apiv2.spacejoy.com/v1/time-tracker/manual",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          manualProjectName: "Personal Tasks",
          entryType: "manual",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create personal tracker: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data as AdminTimeTracker;
  } catch (error) {
    console.error("Error creating personal tracker:", error);
    return null;
  }
}

// ─── Analytics API ───

export async function fetchAnalyticsOrders(
  startDate: string,
  endDate: string,
  skip: number = 0,
  limit: number = 20,
): Promise<{ orders: AnalyticsOrder[]; total: number }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("https://apiv2.spacejoy.com/v1/analytics/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ startDate, endDate, skip, limit }),
  });

  if (!response.ok) throw new Error("Failed to fetch analytics orders");
  return response.json();
}

export async function fetchAnalyticsStats(
  startDate: string,
  endDate: string,
): Promise<AnalyticsStats> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("https://apiv2.spacejoy.com/v1/analytics/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ startDate, endDate }),
  });

  if (!response.ok) throw new Error("Failed to fetch analytics stats");
  return response.json();
}

export async function fetchMonthlyBreakdown(
  year: number,
): Promise<MonthlyBreakdown[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("https://apiv2.spacejoy.com/v1/analytics/monthly", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ year }),
  });

  if (!response.ok) throw new Error("Failed to fetch monthly breakdown");
  return response.json();
}
