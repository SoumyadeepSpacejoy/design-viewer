"use server";

import { Design, DesignDetail } from "./types";

const API_URL = "https://apiv2.spacejoy.com/v1/app/ai-design/getAll/designs";
const DETAIL_API_URL = "https://apiv2.spacejoy.com/v1/app/ai-design";

export async function fetchDesigns(
  skip: number = 0,
  limit: number = 10
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
    console.error("Error fetching designs:", error);
    return [];
  }
}

export async function fetchDesignDetails(
  id: string
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
    console.error("Error fetching design details:", error);
    return null;
  }
}
