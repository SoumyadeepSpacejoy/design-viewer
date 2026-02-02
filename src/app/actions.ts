"use server";

import {
  Design,
  DesignDetail,
  Project,
  ProjectSearchResponse,
  Notification,
} from "./types";

const API_URL = "https://apiv2.spacejoy.com/v1/app/ai-design/getAll/designs";
const DETAIL_API_URL = "https://apiv2.spacejoy.com/v1/app/ai-design";

export async function fetchDesigns(
  skip: number = 0,
  limit: number = 10,
): Promise<Design[]> {
  try {
    const response = await fetch(`${API_URL}?limit=${limit}&skip=${skip}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch designs: ${response.statusText}`);
    }

    const data = await response.json();
    return data as Design[];
  } catch (error) {
    return [];
  }
}

export async function fetchDesignDetails(
  id: string,
): Promise<DesignDetail | null> {
  try {
    const response = await fetch(`${DETAIL_API_URL}/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch design details: ${response.statusText}`);
    }

    const data = await response.json();
    return data as DesignDetail;
  } catch (error) {
    return null;
  }
}

const NOTIFICATION_API_URL = "https://apiv2.spacejoy.com/v1/notification";

export async function fetchNotifications(
  token: string,
  limit: number = 10,
  skip: number = 0,
): Promise<Notification[]> {
  try {
    const response = await fetch(
      `${NOTIFICATION_API_URL}/getAll?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Authorization: token,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data || [];
  } catch (error) {
    return [];
  }
}

export async function createNotification(token: string, data: any) {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function updateNotification(token: string, id: string, data: any) {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/update/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function deleteNotification(token: string, id: string) {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function pushNotification(
  token: string,
  notificationId: string,
  audience?: string | null,
) {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ notificationId, audience }),
    });

    if (!response.ok) {
      throw new Error(`Failed to push notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function searchProjects(
  skip: number = 0,
  limit: number = 20,
): Promise<ProjectSearchResponse> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
        phase: [],
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
