"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRetailer,
  fetchRetailers,
  uploadProductCsv,
} from "@/app/assetApi";
import { Retailer } from "@/app/types";
import SuccessToast from "./SuccessToast";
import PageLoader from "./PageLoader";

// CSV columns are normalized to Asset schema field names (see shopify-manager productMapper).
const CSV_COLUMNS: { name: string; required?: boolean; note: string }[] = [
  { name: "name", required: true, note: "Asset name/title." },
  { name: "sku", required: true, note: "Unique SKU. Rows with an already-existing SKU are skipped." },
  { name: "description", note: "Product description." },
  { name: "price", note: "Selling price (numbers only — currency symbols are stripped)." },
  { name: "msrp", note: "List price for strike-through." },
  { name: "depth", note: "Dimension depth (number)." },
  { name: "width", note: "Dimension width (number)." },
  { name: "height", note: "Dimension height (number)." },
  { name: "dimensionUnit", note: "ft or inch. Defaults to ft." },
  { name: "otherDimensions", note: "Free-text dimensions, if any." },
  { name: "weight", note: "Product weight." },
  { name: "weightUnit", note: "kg or lb. Defaults to lb." },
  { name: "colors", note: "Comma-separated list → lower-cased array (e.g. blue, grey)." },
  { name: "material", note: "Material(s)." },
  { name: "category", note: "Maps to taxonomy category." },
  { name: "subcategory", note: "Maps to taxonomy subcategory." },
  { name: "vertical", note: "Maps to taxonomy vertical." },
  { name: "tags", note: "Comma-separated list → tags array." },
  { name: "productImages", note: "Comma-separated image URLs. First becomes the primary image. (Or use image1…image21 columns.)" },
  { name: "retailLink", note: "Retailer product link (https:// added if missing)." },
  { name: "wholesaleLink", note: "Wholesale link, if any." },
  { name: "countryOfOrigin", note: "Country of origin." },
  { name: "assemblyInfo", note: "Assembly instructions/notes." },
  { name: "status", note: "Asset status. Defaults to Active." },
  { name: "inStock", note: "true/false (yes/y/1). Defaults to true." },
  { name: "shoppable", note: "true/false (yes/y/1). Defaults to true." },
];

export default function AssetManagement() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showCsvInfo, setShowCsvInfo] = useState(false);

  // ─── retailer create form ───
  const [showRetailerForm, setShowRetailerForm] = useState(false);
  const [retailerName, setRetailerName] = useState("");
  const [retailerUrl, setRetailerUrl] = useState("");
  const [retailerDesc, setRetailerDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [retailerError, setRetailerError] = useState("");

  // ─── csv upload ───
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRetailers = useCallback(async () => {
    const data = await fetchRetailers();
    setRetailers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRetailers();
  }, [loadRetailers]);

  const handleCreateRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retailerName.trim()) return;
    setCreating(true);
    setRetailerError("");
    try {
      const created = await createRetailer({
        name: retailerName.trim(),
        url: retailerUrl.trim() || undefined,
        description: retailerDesc.trim() || undefined,
      });
      setToast(`Retailer "${created.name}" created`);
      setRetailerName("");
      setRetailerUrl("");
      setRetailerDesc("");
      setShowRetailerForm(false);
      await loadRetailers();
      setSelectedRetailer(created._id);
    } catch (err) {
      setRetailerError((err as Error)?.message || "Failed to create retailer");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    if (!selectedRetailer) {
      setUploadError("Please select a retailer.");
      return;
    }
    if (!file) {
      setUploadError("Please choose a CSV file.");
      return;
    }
    const retailer = retailers.find((r) => r._id === selectedRetailer);
    setUploading(true);
    try {
      const result = await uploadProductCsv(
        file,
        selectedRetailer,
        retailer?.name || "",
      );
      setToast(result.message || `${result.count} products queued`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError((err as Error)?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asset Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk-upload products from a CSV and manage retailers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── CSV Upload ─── */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Upload Products</h2>
              <p className="text-xs text-muted-foreground">CSV is queued for processing under the selected retailer.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCsvInfo(true)}
              title="View required CSV structure"
              className="ml-auto shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Retailer</label>
              <select
                className="input"
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
              >
                <option value="">Select a retailer…</option>
                {retailers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CSV file</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/70 file:cursor-pointer cursor-pointer"
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="text-foreground font-medium">{file.name}</span>
                </p>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload CSV"}
            </button>
          </form>
        </div>

        {/* ─── Retailers ─── */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                  <path d="M12 3v6" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Retailers</h2>
                <p className="text-xs text-muted-foreground">{retailers.length} total</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRetailerForm((v) => !v)}
            >
              {showRetailerForm ? "Cancel" : "Add Retailer"}
            </button>
          </div>

          {showRetailerForm && (
            <form onSubmit={handleCreateRetailer} className="space-y-3 rounded-lg border border-border p-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name *</label>
                <input
                  className="input"
                  value={retailerName}
                  onChange={(e) => setRetailerName(e.target.value)}
                  placeholder="e.g. Harper Studios"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">URL</label>
                <input
                  className="input"
                  value={retailerUrl}
                  onChange={(e) => setRetailerUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  className="input"
                  value={retailerDesc}
                  onChange={(e) => setRetailerDesc(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {retailerError && <p className="text-xs text-destructive">{retailerError}</p>}
              <button type="submit" className="btn btn-primary btn-sm w-full" disabled={creating}>
                {creating ? "Creating…" : "Create Retailer"}
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {retailers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No retailers yet.</p>
            ) : (
              retailers.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <code className="text-[11px] text-muted-foreground/60">{r._id}</code>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── CSV structure modal ─── */}
      {showCsvInfo && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowCsvInfo(false)}
        >
          <div
            className="card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">CSV structure</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Format your CSV with these column headers before uploading.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvInfo(false)}
                className="btn-icon btn-ghost"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4 font-medium">Column</th>
                    <th className="py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CSV_COLUMNS.map((col) => (
                    <tr key={col.name} className="border-b border-border/50 last:border-0 align-top">
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <code className="text-xs font-semibold text-foreground">{col.name}</code>
                        {col.required && (
                          <span className="ml-1.5 badge badge-primary text-[10px]">required</span>
                        )}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs leading-relaxed">{col.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                Unlisted columns are ignored. Header names must match exactly (case-sensitive).
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && <SuccessToast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
