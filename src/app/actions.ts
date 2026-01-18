"use server";

import { Design, DesignDetail } from "./types";

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

export async function pushNotification(token: string, notificationId: string) {
  try {
    const response = await fetch(`${NOTIFICATION_API_URL}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to push notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
import { Notification } from "./types";
