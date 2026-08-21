import { A } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { createRetailer, fetchRetailers, uploadProductCsv } from "~/lib/assetApi";
import type { Retailer } from "~/lib/types";
import AssetSearch from "./AssetSearch";
import PageLoader from "./PageLoader";
import SuccessToast from "./SuccessToast";

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
  const [retailers, setRetailers] = createSignal<Retailer[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [toast, setToast] = createSignal("");
  const [showCsvInfo, setShowCsvInfo] = createSignal(false);
  const [tab, setTab] = createSignal<"search" | "upload">("search");

  // ─── retailer create form ───
  const [showRetailerForm, setShowRetailerForm] = createSignal(false);
  const [retailerName, setRetailerName] = createSignal("");
  const [retailerUrl, setRetailerUrl] = createSignal("");
  const [retailerDesc, setRetailerDesc] = createSignal("");
  const [creating, setCreating] = createSignal(false);
  const [retailerError, setRetailerError] = createSignal("");

  // ─── csv upload ───
  const [selectedRetailer, setSelectedRetailer] = createSignal("");
  const [file, setFile] = createSignal<File | null>(null);
  const [uploading, setUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal("");
  let fileInputRef: HTMLInputElement | undefined;

  const loadRetailers = async () => {
    setRetailers(await fetchRetailers());
    setLoading(false);
  };

  onMount(() => {
    loadRetailers();
  });

  const handleCreateRetailer = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!retailerName().trim()) return;
    setCreating(true);
    setRetailerError("");
    try {
      const created = await createRetailer({
        name: retailerName().trim(),
        url: retailerUrl().trim() || undefined,
        description: retailerDesc().trim() || undefined,
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

  const handleUpload = async (e: SubmitEvent) => {
    e.preventDefault();
    setUploadError("");
    if (!selectedRetailer()) {
      setUploadError("Please select a retailer.");
      return;
    }
    const csv = file();
    if (!csv) {
      setUploadError("Please choose a CSV file.");
      return;
    }
    const retailer = retailers().find((r) => r._id === selectedRetailer());
    setUploading(true);
    try {
      const result = await uploadProductCsv(
        csv,
        selectedRetailer(),
        retailer?.name || "",
      );
      setToast(result.message || `${result.count} products queued`);
      setFile(null);
      if (fileInputRef) fileInputRef.value = "";
    } catch (err) {
      setUploadError((err as Error)?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Show when={!loading()} fallback={<PageLoader />}>
      <div class="space-y-8">
        {/* Header */}
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Asset Management</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Search the asset catalogue, bulk-upload products from a CSV and manage retailers.
            </p>
          </div>
          <A href="/asset-management/create" class="btn btn-primary shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create Asset
          </A>
        </div>

        {/* ─── tabs ─── */}
        <div class="flex items-center gap-1 border-b border-border">
          <For
            each={[
              { id: "search", label: "Search Assets" },
              { id: "upload", label: "Bulk Upload" },
            ] as const}
          >
            {(item) => (
              <button
                type="button"
                onClick={() => setTab(item.id)}
                class={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                  tab() === item.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>

        <Show when={tab() === "search"}>
          <AssetSearch />
        </Show>

        <div
          class={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${tab() === "upload" ? "" : "hidden"}`}
        >
          {/* ─── CSV Upload ─── */}
          <div class="card p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-foreground">Upload Products</h2>
                <p class="text-xs text-muted-foreground">
                  CSV is queued for processing under the selected retailer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvInfo(true)}
                title="View required CSV structure"
                class="ml-auto shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground">Retailer</label>
                <select
                  class="input"
                  value={selectedRetailer()}
                  onChange={(e) => setSelectedRetailer(e.currentTarget.value)}
                >
                  <option value="">Select a retailer…</option>
                  <For each={retailers()}>
                    {(r) => <option value={r._id}>{r.name}</option>}
                  </For>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground">CSV file</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.currentTarget.files?.[0] || null)}
                  class="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/70 file:cursor-pointer cursor-pointer"
                />
                <Show when={file()}>
                  <p class="text-xs text-muted-foreground">
                    Selected:{" "}
                    <span class="text-foreground font-medium">{file()!.name}</span>
                  </p>
                </Show>
              </div>

              <Show when={uploadError()}>
                <p class="text-xs text-destructive">{uploadError()}</p>
              </Show>

              <button type="submit" class="btn btn-primary w-full" disabled={uploading()}>
                {uploading() ? "Uploading…" : "Upload CSV"}
              </button>
            </form>
          </div>

          {/* ─── Retailers ─── */}
          <div class="card p-6 space-y-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                    <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                    <path d="M12 3v6" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-semibold text-foreground">Retailers</h2>
                  <p class="text-xs text-muted-foreground">{retailers().length} total</p>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                onClick={() => setShowRetailerForm((v) => !v)}
              >
                {showRetailerForm() ? "Cancel" : "Add Retailer"}
              </button>
            </div>

            <Show when={showRetailerForm()}>
              <form
                onSubmit={handleCreateRetailer}
                class="space-y-3 rounded-lg border border-border p-4 animate-fade-in"
              >
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-muted-foreground">Name *</label>
                  <input
                    class="input"
                    value={retailerName()}
                    onInput={(e) => setRetailerName(e.currentTarget.value)}
                    placeholder="e.g. Harper Studios"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-muted-foreground">URL</label>
                  <input
                    class="input"
                    value={retailerUrl()}
                    onInput={(e) => setRetailerUrl(e.currentTarget.value)}
                    placeholder="https://…"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-muted-foreground">Description</label>
                  <input
                    class="input"
                    value={retailerDesc()}
                    onInput={(e) => setRetailerDesc(e.currentTarget.value)}
                    placeholder="Optional"
                  />
                </div>
                <Show when={retailerError()}>
                  <p class="text-xs text-destructive">{retailerError()}</p>
                </Show>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm w-full"
                  disabled={creating()}
                >
                  {creating() ? "Creating…" : "Create Retailer"}
                </button>
              </form>
            </Show>

            <div class="space-y-2 max-h-[360px] overflow-y-auto">
              <Show
                when={retailers().length > 0}
                fallback={
                  <p class="text-sm text-muted-foreground py-8 text-center">
                    No retailers yet.
                  </p>
                }
              >
                <For each={retailers()}>
                  {(r) => (
                    <div class="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                      <span class="text-sm font-medium text-foreground">{r.name}</span>
                      <code class="text-[11px] text-muted-foreground/60">{r._id}</code>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </div>
        </div>

        {/* ─── CSV structure modal ─── */}
        <Show when={showCsvInfo()}>
          <div
            class="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setShowCsvInfo(false)}
          >
            <div
              class="card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 class="text-base font-semibold text-foreground">CSV structure</h3>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    Format your CSV with these column headers before uploading.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCsvInfo(false)}
                  class="btn-icon btn-ghost"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div class="overflow-y-auto px-6 py-4">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th class="py-2 pr-4 font-medium">Column</th>
                      <th class="py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={CSV_COLUMNS}>
                      {(col) => (
                        <tr class="border-b border-border/50 last:border-0 align-top">
                          <td class="py-2.5 pr-4 whitespace-nowrap">
                            <code class="text-xs font-semibold text-foreground">
                              {col.name}
                            </code>
                            <Show when={col.required}>
                              <span class="ml-1.5 badge badge-primary text-[10px]">
                                required
                              </span>
                            </Show>
                          </td>
                          <td class="py-2.5 text-muted-foreground text-xs leading-relaxed">
                            {col.note}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <div class="px-6 py-3 border-t border-border">
                <p class="text-[11px] text-muted-foreground">
                  Unlisted columns are ignored. Header names must match exactly (case-sensitive).
                </p>
              </div>
            </div>
          </div>
        </Show>

        <Show when={toast()}>
          <SuccessToast message={toast()} onClose={() => setToast("")} />
        </Show>
      </div>
    </Show>
  );
}
