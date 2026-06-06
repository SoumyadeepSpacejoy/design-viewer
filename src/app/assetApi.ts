"use client";

import { Retailer } from "./types";

// shopify-manager service — handles bulk asset upload + retailer management
const BASE_URL = "https://shopify-manager.spacejoy.com/v1/product-upload";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: token } : {};
}

export interface CreateRetailerInput {
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  logoCdn?: string;
}

export interface UploadResult {
  message: string;
  count: number;
}

export async function fetchRetailers(): Promise<Retailer[]> {
  try {
    const response = await fetch(`${BASE_URL}/retailers`, {
      method: "GET",
      headers: { ...authHeader() },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch retailers: ${response.statusText}`);
    }
    const data = await response.json();
    return (data || []) as Retailer[];
  } catch (error) {
    console.error("Error fetching retailers:", error);
    return [];
  }
}

export async function createRetailer(
  input: CreateRetailerInput,
): Promise<Retailer> {
  const response = await fetch(`${BASE_URL}/retailer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Failed to create retailer (${response.status})`);
  }
  return data.retailer as Retailer;
}

export async function uploadProductCsv(
  file: File,
  retailerId: string,
  retailerName: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("retailerId", retailerId);
  formData.append("retailerName", retailerName);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { ...authHeader() }, // no Content-Type — browser sets multipart boundary
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Upload failed (${response.status})`);
  }
  return data as UploadResult;
}
