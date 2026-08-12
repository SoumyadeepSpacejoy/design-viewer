"use client";

import { Retailer } from "./types";

// shopify-manager service — handles bulk asset upload + retailer management
const BASE_URL = "https://shopify-manager.spacejoy.com/v1/product-upload";
// admin api — asset search lives behind the user auth middleware
const API_V2 = "https://apiv2.spacejoy.com/v1";
// ecom api — public taxonomy used to populate the category/subcategory/vertical pickers
const ECOM_URL = "https://api-ecom.spacejoy.com/api";

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

/* ─────────────────────────── taxonomy ─────────────────────────── */

export interface TaxonomyCategory {
  _id: string;
  name: string;
  priority?: number;
}

export interface TaxonomySubcategory {
  _id: string;
  name: string;
  category: string;
  priority?: number;
}

export interface TaxonomyVertical {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
}

export interface Taxonomy {
  categories: TaxonomyCategory[];
  subcategories: TaxonomySubcategory[];
  verticals: TaxonomyVertical[];
}

const EMPTY_TAXONOMY: Taxonomy = {
  categories: [],
  subcategories: [],
  verticals: [],
};

export async function fetchTaxonomy(): Promise<Taxonomy> {
  try {
    const response = await fetch(`${ECOM_URL}/asset/taxonomy`);
    if (!response.ok) {
      throw new Error(`Failed to fetch taxonomy: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      categories: data?.categories || [],
      subcategories: data?.subcategories || [],
      verticals: data?.verticals || [],
    };
  } catch (error) {
    console.error("Error fetching taxonomy:", error);
    return EMPTY_TAXONOMY;
  }
}

// the shopify-manager list only covers upload-enabled retailers and the ecom one
// hides part of the catalogue, so search and create pull preferred retailers from
// the admin api instead — it pages, hence the loop
const RETAILER_PAGE = 500;

export async function fetchAllRetailers(): Promise<Retailer[]> {
  const token = localStorage.getItem("token");
  if (!token) return [];

  try {
    const all: Retailer[] = [];
    let total = Infinity;

    while (all.length < total) {
      const response = await fetch(
        `${API_V2}/retailer?preferred=true&limit=${RETAILER_PAGE}&skip=${all.length}`,
        { headers: { Authorization: `${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch retailers: ${response.statusText}`);
      }
      const data = await response.json();
      const page: Retailer[] = data?.retailers || [];
      all.push(...page);
      total = Number(data?.count) || all.length;
      if (page.length === 0) break; // guard against a bad count stalling the loop
    }

    return all.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } catch (error) {
    console.error("Error fetching all retailers:", error);
    return [];
  }
}

/* ──────────────────────────── search ──────────────────────────── */

export interface RangeFilter {
  start: number | string;
  end: number | string;
}

export interface AssetSearchFilters {
  category: string[];
  subcategory: string[];
  vertical: string[];
  retailer: string[];
  status: string[];
  colors: string[];
  material: string[];
  designStyle: string[];
  tags: string[];
  country: string[];
  sku: string[];
  whiteLabelName: string[];
  price?: RangeFilter | null;
  width?: RangeFilter | null;
  height?: RangeFilter | null;
  depth?: RangeFilter | null;
  inStock: "all" | "inStock" | "outOfStock";
}

export const emptyAssetFilters = (): AssetSearchFilters => ({
  category: [],
  subcategory: [],
  vertical: [],
  retailer: [],
  status: [],
  colors: [],
  material: [],
  designStyle: [],
  tags: [],
  country: [],
  sku: [],
  whiteLabelName: [],
  price: null,
  width: null,
  height: null,
  depth: null,
  inStock: "all",
});

export interface AssetSearchResult {
  _id: string;
  name: string;
  imageUrl?: string;
  inStock?: boolean;
  price: number;
  msrp?: number;
  currency?: string;
  retailLink?: string;
  wholesaleLink?: string;
  whiteLabelProduct?: string;
  whitelabelName?: string;
  country?: string;
  retailer?: string;
  vertical?: string;
  incentive?: number;
  sku?: string;
  width?: number;
  height?: number;
  depth?: number;
  properties?: {
    colors?: string;
    material?: string;
    tags?: string;
    designStyle?: string;
  };
}

export interface AssetSearchResponse {
  assets: AssetSearchResult[];
  count: number;
}

export type AssetSortKey = "newest" | "oldest" | "priceAsc" | "priceDesc";

const SORT_MAP: Record<AssetSortKey, Record<string, number>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
};

export interface SearchAssetsInput {
  filters: AssetSearchFilters;
  searchText?: string;
  sort?: AssetSortKey;
  wholesale?: boolean;
  limit?: number;
  skip?: number;
}

export async function searchAssets({
  filters,
  searchText = "",
  sort = "newest",
  wholesale = false,
  limit = 24,
  skip = 0,
}: SearchAssetsInput): Promise<AssetSearchResponse> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_V2}/asset/search?limit=${limit}&skip=${skip}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `${token}` },
      body: JSON.stringify({
        filters,
        searchText: searchText.trim(),
        sort: SORT_MAP[sort],
        wholesale,
      }),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Search failed (${response.status})`);
  }
  return { assets: data?.assets || [], count: data?.count || 0 };
}

/* ──────────────────────────── create ──────────────────────────── */

export interface CreateAssetInput {
  name: string;
  description?: string;
  price?: string;
  msrp?: string;
  currency?: string;
  country?: string;
  weight?: string;
  weightUnit?: string;
  depth?: string;
  width?: string;
  height?: string;
  dimensionUnit?: string;
  otherDimensions?: string;
  material?: string;
  colors?: string;
  designStyle?: string;
  tags?: string;
  retailer?: string;
  whiteLabelRetailer?: string;
  whiteLabelProduct?: string;
  retailLink?: string;
  wholesaleLink?: string;
  category: string;
  subcategory: string;
  vertical: string;
  shoppable?: boolean;
  inStock?: boolean;
  stockQty?: string;
  status?: string;
}

export async function createAsset(
  input: CreateAssetInput,
  images: File[],
): Promise<{ _id: string; name: string }> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });
  images.forEach((image) => formData.append("images", image));

  const response = await fetch(`${API_V2}/asset/create`, {
    method: "POST",
    headers: { Authorization: `${token}` }, // no Content-Type — browser sets the boundary
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Failed to create asset (${response.status})`);
  }
  return data;
}

/* ─────────────────────── fetch one / update ─────────────────────── */

export interface AssetImage {
  fileUrl: string;
  cdn?: string;
}

// the full document, as returned by GET /asset/:id — richer than a search hit
export interface AssetDetail {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  msrp?: number;
  currency?: string;
  country?: string;
  weight?: string;
  weightUnit?: string;
  dimension?: { width?: number; height?: number; depth?: number };
  dimensionUnit?: string;
  otherDimensions?: string;
  material?: string;
  colors?: string[];
  tags?: string[];
  retailer?: string;
  whiteLabelRetailer?: string | null;
  whiteLabelProduct?: string;
  retailLink?: string;
  wholesaleLink?: string;
  slug?: string;
  meta?: { category?: string; subcategory?: string; vertical?: string };
  properties?: {
    colors?: string;
    material?: string;
    tags?: string;
    designStyle?: string;
  };
  productImages?: AssetImage[];
  imageUrl?: string;
  shoppable?: boolean;
  inStock?: boolean;
  stockQty?: number;
  status?: string;
}

export async function fetchAsset(id: string): Promise<AssetDetail> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_V2}/asset/${id}`, {
    headers: { Authorization: `${token}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Failed to load asset (${response.status})`);
  }
  return data as AssetDetail;
}

export async function updateAsset(
  id: string,
  input: CreateAssetInput,
  newImages: File[],
  keptImages: AssetImage[],
): Promise<AssetDetail> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  });
  // images the user kept, in order — the server appends the new uploads to these
  formData.append("existingImages", JSON.stringify(keptImages));
  newImages.forEach((image) => formData.append("images", image));

  const response = await fetch(`${API_V2}/asset/${id}`, {
    method: "PUT",
    headers: { Authorization: `${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Failed to update asset (${response.status})`);
  }
  return data as AssetDetail;
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
