"use client";

import {
  AdminTimeTracker,
  Project,
  ProjectSearchResponse,
  TimeTracker,
  TimeTrackerSession,
  TimeTrackerState,
} from "./types";

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
    return data as TimeTracker[];
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
    return data as TimeTracker;
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
    return data as TimeTracker;
  } catch (error) {
    console.error("Error updating overtime reason:", error);
    throw error;
  }
}
