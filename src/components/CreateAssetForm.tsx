import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  createAsset,
  fetchAllRetailers,
  fetchAsset,
  fetchTaxonomy,
  updateAsset,
  type AssetImage,
  type CreateAssetInput,
  type Taxonomy,
} from "~/lib/assetApi";
import type { Retailer } from "~/lib/types";
import PageLoader from "./PageLoader";
import SuccessToast from "./SuccessToast";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

// mirrors Constants.Status on the asset schema
const STATUS_OPTIONS = ["active", "pending", "inactive", "discontinued"];
const COUNTRY_OPTIONS = ["USA", "UAE", "CAN"];
const CURRENCY_OPTIONS = ["usd", "inr", "aed"];

interface Preview {
  file: File;
  url: string;
}

// mirrors gcsHelper.extractGcsName on the api — the raw bucket URL is served
// through the ImageKit host instead
const toImageKit = (url?: string) => {
  if (!url) return "";
  const path = url
    .split("?")[0]
    .replace(
      /^https:\/\/storage\.googleapis\.com\/(?:migration-spj-main|spacejoy-main)\//,
      "",
    );
  if (path.startsWith("http")) return path;
  return `https://ik.imagekit.io/spacejoy/${path}`;
};

function Section(props: {
  title: string;
  description?: string;
  children: JSX.Element;
}) {
  return (
    <section class="card p-6 space-y-5">
      <div>
        <h2 class="text-base font-semibold text-foreground">{props.title}</h2>
        <Show when={props.description}>
          <p class="text-xs text-muted-foreground mt-0.5">{props.description}</p>
        </Show>
      </div>
      {props.children}
    </section>
  );
}

function Field(props: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: JSX.Element;
}) {
  return (
    <div class="space-y-1.5">
      <label class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {props.label}
        <Show when={props.required}>
          <span class="text-destructive ml-0.5">*</span>
        </Show>
      </label>
      {props.children}
      <Show
        when={props.error}
        fallback={
          <Show when={props.hint}>
            <p class="text-[11px] text-muted-foreground/70">{props.hint}</p>
          </Show>
        }
      >
        <p class="text-[11px] text-destructive">{props.error}</p>
      </Show>
    </div>
  );
}

// retailer lists run into the hundreds, so these get a type-ahead rather than a
// plain <select> you have to scroll
function SearchableSelect(props: {
  options: { _id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");

  const selected = () => props.options.find((option) => option._id === props.value);
  const visible = () =>
    query().trim()
      ? props.options.filter((option) =>
          option.name?.toLowerCase().includes(query().trim().toLowerCase()),
        )
      : props.options;

  return (
    <div class="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        class="input flex items-center justify-between text-left"
      >
        <span class={selected() ? "text-foreground" : "text-muted-foreground"}>
          {selected()?.name || props.placeholder}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class={`shrink-0 opacity-50 transition-transform ${open() ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Show when={open()}>
        <div class="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div class="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-lg p-1.5 animate-fade-in-scale">
          <input
            autofocus
            class="input h-8 text-[13px] mb-1.5"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="Type to search…"
          />
          <div class="max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                props.onChange("");
                setOpen(false);
              }}
              class={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                !props.value
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {props.emptyLabel}
            </button>
            <For each={visible()}>
              {(option) => (
                <button
                  type="button"
                  onClick={() => {
                    props.onChange(option._id);
                    setOpen(false);
                  }}
                  class={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                    props.value === option._id
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {option.name}
                </button>
              )}
            </For>
            <Show when={visible().length === 0}>
              <p class="px-2.5 py-3 text-[12px] text-muted-foreground">
                Nothing matches “{query()}”.
              </p>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default function CreateAssetForm(props: { assetId?: string }) {
  const navigate = useNavigate();
  const isEdit = () => !!props.assetId;

  const [taxonomy, setTaxonomy] = createSignal<Taxonomy>({
    categories: [],
    subcategories: [],
    verticals: [],
  });
  const [retailers, setRetailers] = createSignal<Retailer[]>([]);

  const [form, setForm] = createStore<CreateAssetInput>({
    name: "",
    description: "",
    price: "",
    msrp: "",
    currency: "usd",
    country: "USA",
    weight: "",
    weightUnit: "lb",
    depth: "",
    width: "",
    height: "",
    dimensionUnit: "inch",
    otherDimensions: "",
    material: "",
    colors: "",
    designStyle: "",
    tags: "",
    retailer: "",
    whiteLabelRetailer: "",
    whiteLabelProduct: "",
    retailLink: "",
    wholesaleLink: "",
    category: "",
    subcategory: "",
    vertical: "",
    shoppable: true,
    inStock: true,
    stockQty: "",
    status: "active",
    sku: "",
  });

  const [previews, setPreviews] = createSignal<Preview[]>([]);
  const [keptImages, setKeptImages] = createSignal<AssetImage[]>([]);
  const [dragging, setDragging] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [loading, setLoading] = createSignal(!!props.assetId);
  const [loadError, setLoadError] = createSignal("");
  const [error, setError] = createSignal("");
  const [errors, setErrors] = createStore<Record<string, string>>({});
  const [toast, setToast] = createSignal("");
  let fileInputRef: HTMLInputElement | undefined;

  onMount(() => {
    fetchTaxonomy().then(setTaxonomy);
    fetchAllRetailers().then(setRetailers);
  });

  // edit mode — hydrate the form from the stored asset
  const loadAsset = () => {
    const assetId = props.assetId;
    if (!assetId) return;
    setLoading(true);
    setLoadError("");
    fetchAsset(assetId)
      .then((asset) => {
        setForm({
          name: asset.name || "",
          description: asset.description || "",
          price: asset.price != null ? String(asset.price) : "",
          msrp: asset.msrp != null ? String(asset.msrp) : "",
          currency: asset.currency || "usd",
          country: asset.country || "USA",
          weight: asset.weight || "",
          weightUnit: asset.weightUnit || "lb",
          depth: asset.dimension?.depth != null ? String(asset.dimension.depth) : "",
          width: asset.dimension?.width != null ? String(asset.dimension.width) : "",
          height: asset.dimension?.height != null ? String(asset.dimension.height) : "",
          dimensionUnit: asset.dimensionUnit || "inch",
          otherDimensions: asset.otherDimensions || "",
          material: asset.properties?.material || asset.material || "",
          colors: asset.properties?.colors || (asset.colors || []).join(", "),
          designStyle: asset.properties?.designStyle || "",
          tags: asset.properties?.tags || (asset.tags || []).join(", "),
          retailer: asset.retailer || "",
          whiteLabelRetailer: asset.whiteLabelRetailer || "",
          whiteLabelProduct: asset.whiteLabelProduct || "",
          retailLink: asset.retailLink || "",
          wholesaleLink: asset.wholesaleLink || "",
          category: asset.meta?.category || "",
          subcategory: asset.meta?.subcategory || "",
          vertical: asset.meta?.vertical || "",
          shoppable: asset.shoppable !== false,
          inStock: asset.inStock !== false,
          stockQty: asset.stockQty != null ? String(asset.stockQty) : "",
          status: asset.status || "active",
          sku: asset.sku || "",
        });
        setKeptImages(asset.productImages || []);
      })
      .catch((err) => setLoadError((err as Error)?.message || "Failed to load asset"))
      .finally(() => setLoading(false));
  };

  createEffect(on(() => props.assetId, () => loadAsset()));

  // object URLs are released on unmount (and individually on remove) — revoking
  // whenever `previews` changes would kill the URLs of images still on screen
  onCleanup(() => previews().forEach((preview) => URL.revokeObjectURL(preview.url)));

  const subcategoryOptions = createMemo(() =>
    form.category
      ? taxonomy().subcategories.filter((s) => String(s.category) === form.category)
      : [],
  );

  const verticalOptions = createMemo(() =>
    form.subcategory
      ? taxonomy().verticals.filter((v) => String(v.subcategory) === form.subcategory)
      : [],
  );

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const oversized = incoming.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" is larger than 30MB.`);
      return;
    }
    setError("");
    setPreviews((prev) =>
      [
        ...prev,
        ...incoming.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ].slice(0, MAX_IMAGES),
    );
  };

  const removeNewImage = (index: number) =>
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });

  const removeKeptImage = (index: number) =>
    setKeptImages((prev) => prev.filter((_, i) => i !== index));

  // stored images first, then the new uploads — the same order the api rebuilds
  // productImages in, so the PRIMARY badge below is always truthful
  const gallery = createMemo(() => [
    ...keptImages().map((image, index) => ({
      key: `kept-${image.fileUrl}-${index}`,
      url: toImageKit(image.fileUrl),
      label: "",
      remove: () => removeKeptImage(index),
    })),
    ...previews().map((preview, index) => ({
      key: preview.url,
      url: preview.url,
      label: "NEW",
      remove: () => removeNewImage(index),
    })),
  ]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.category) next.category = "Category is required.";
    if (!form.subcategory) next.subcategory = "Subcategory is required.";
    if (!form.vertical) next.vertical = "Vertical is required.";
    if (gallery().length === 0) next.images = "At least one image is required.";
    setErrors({
      name: next.name,
      category: next.category,
      subcategory: next.subcategory,
      vertical: next.vertical,
      images: next.images,
    });
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const files = previews().map((preview) => preview.file);
      const payload = { ...form };
      const asset = isEdit()
        ? await updateAsset(props.assetId!, payload, files, keptImages())
        : await createAsset(payload, files);
      setToast(`"${asset.name}" ${isEdit() ? "updated" : "created"}`);
      setTimeout(() => navigate("/asset-management"), 900);
    } catch (err) {
      setError(
        (err as Error)?.message || `Failed to ${isEdit() ? "update" : "create"} asset`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show when={!loading()} fallback={<PageLoader />}>
      {/* never fall through to an empty form in edit mode — a blank form here reads as
          "this asset has no data" when the real problem is the fetch */}
      <Show
        when={!loadError()}
        fallback={
          <div class="max-w-lg mx-auto py-20 text-center space-y-4">
            <div class="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-foreground">
                Couldn’t load this asset
              </h2>
              <p class="text-sm text-muted-foreground">{loadError()}</p>
              <p class="text-xs text-muted-foreground/70 pt-1">
                Asset ID: <code>{props.assetId}</code>
              </p>
            </div>
            <div class="flex items-center justify-center gap-2 pt-1">
              <button type="button" onClick={loadAsset} class="btn btn-primary btn-sm">
                Try again
              </button>
              <button
                type="button"
                onClick={() => navigate("/asset-management")}
                class="btn btn-secondary btn-sm"
              >
                Back
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} class="space-y-5">
          {/* ─── header ─── */}
          <div class="flex items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate("/asset-management")}
                class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Asset Management
              </button>
              <h1 class="text-2xl font-bold text-foreground">
                {isEdit() ? "Edit Asset" : "Create Asset"}
              </h1>
              <p class="text-sm text-muted-foreground mt-1">
                {isEdit()
                  ? "Update the product details. Changes re-index the asset for search."
                  : "Fill in the product details and upload its images."}
              </p>
            </div>
          </div>

          {/* ─── images ─── */}
          <Section
            title="Images"
            description={`First image becomes the primary. Up to ${MAX_IMAGES}, 30MB each.`}
          >
            {/* dropzone sits beside the thumbnails so the section stays one screen tall */}
            <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer?.files ?? null);
                }}
                onClick={() => fileInputRef?.click()}
                class={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                  dragging()
                    ? "border-foreground/40 bg-secondary"
                    : errors.images
                      ? "border-destructive/50"
                      : "border-border hover:border-foreground/25 hover:bg-muted/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  onChange={(e) => {
                    addFiles(e.currentTarget.files);
                    e.currentTarget.value = "";
                  }}
                />
                <svg
                  class="mx-auto mb-2 text-muted-foreground"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <p class="text-[13px] text-foreground font-medium leading-snug">
                  Drop images or click to browse
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">PNG, JPG or WEBP</p>
                <Show when={errors.images}>
                  <p class="text-[11px] text-destructive mt-1.5">{errors.images}</p>
                </Show>
              </div>

              <Show when={gallery().length > 0}>
                <div class="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-2.5">
                  <For each={gallery()}>
                    {(item, index) => (
                      <div class="relative aspect-square rounded-lg overflow-hidden border border-border bg-white group">
                        <img
                          src={item.url}
                          alt=""
                          class="absolute inset-0 w-full h-full object-contain p-1.5"
                        />
                        <Show
                          when={index() === 0}
                          fallback={
                            <Show when={item.label}>
                              <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[9px] font-semibold">
                                {item.label}
                              </span>
                            </Show>
                          }
                        >
                          <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-foreground text-background text-[9px] font-semibold">
                            PRIMARY
                          </span>
                        </Show>
                        <button
                          type="button"
                          onClick={item.remove}
                          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Section>

          {/* the rest pairs up on wide screens so the form fills the viewport
              instead of running as one narrow column */}
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            {/* ─── basics ─── */}
            <Section title="Basics">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <Field label="Name" required error={errors.name}>
                    <input
                      class="input"
                      value={form.name}
                      onInput={(e) => setForm("name", e.currentTarget.value)}
                      placeholder="e.g. Teal Velvet Chaise Lounge"
                    />
                  </Field>
                </div>
                <Field label="SKU" hint="Saved to the product feed mapping">
                  <input
                    class="input"
                    value={form.sku}
                    onInput={(e) => setForm("sku", e.currentTarget.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  class="input min-h-28 py-2.5"
                  value={form.description}
                  onInput={(e) => setForm("description", e.currentTarget.value)}
                  placeholder="Product description shown on the asset page."
                />
              </Field>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Category" required error={errors.category}>
                  <select
                    class="input"
                    value={form.category}
                    onChange={(e) => {
                      setForm("category", e.currentTarget.value);
                      setForm("subcategory", "");
                      setForm("vertical", "");
                    }}
                  >
                    <option value="">Select…</option>
                    <For each={taxonomy().categories}>
                      {(c) => <option value={c._id}>{c.name}</option>}
                    </For>
                  </select>
                </Field>

                <Field label="Subcategory" required error={errors.subcategory}>
                  <select
                    class="input"
                    value={form.subcategory}
                    disabled={!form.category}
                    onChange={(e) => {
                      setForm("subcategory", e.currentTarget.value);
                      setForm("vertical", "");
                    }}
                  >
                    <option value="">
                      {form.category ? "Select…" : "Pick a category first"}
                    </option>
                    <For each={subcategoryOptions()}>
                      {(s) => <option value={s._id}>{s.name}</option>}
                    </For>
                  </select>
                </Field>

                <Field label="Vertical" required error={errors.vertical}>
                  <select
                    class="input"
                    value={form.vertical}
                    disabled={!form.subcategory}
                    onChange={(e) => setForm("vertical", e.currentTarget.value)}
                  >
                    <option value="">
                      {form.subcategory ? "Select…" : "Pick a subcategory first"}
                    </option>
                    <For each={verticalOptions()}>
                      {(v) => <option value={v._id}>{v.name}</option>}
                    </For>
                  </select>
                </Field>
              </div>
            </Section>

            {/* ─── pricing ─── */}
            <Section title="Pricing & availability">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Price">
                  <input
                    class="input"
                    type="number"
                    value={form.price}
                    onInput={(e) => setForm("price", e.currentTarget.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="MSRP" hint="Defaults to price">
                  <input
                    class="input"
                    type="number"
                    value={form.msrp}
                    onInput={(e) => setForm("msrp", e.currentTarget.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Currency">
                  <select
                    class="input"
                    value={form.currency}
                    onChange={(e) => setForm("currency", e.currentTarget.value)}
                  >
                    <For each={CURRENCY_OPTIONS}>
                      {(c) => <option value={c}>{c.toUpperCase()}</option>}
                    </For>
                  </select>
                </Field>
                <Field label="Country">
                  <select
                    class="input"
                    value={form.country}
                    onChange={(e) => setForm("country", e.currentTarget.value)}
                  >
                    <For each={COUNTRY_OPTIONS}>
                      {(c) => <option value={c}>{c}</option>}
                    </For>
                  </select>
                </Field>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Status">
                  <select
                    class="input"
                    value={form.status}
                    onChange={(e) => setForm("status", e.currentTarget.value)}
                  >
                    <For each={STATUS_OPTIONS}>
                      {(s) => <option value={s}>{s}</option>}
                    </For>
                  </select>
                </Field>
                <Field label="Stock qty">
                  <input
                    class="input"
                    type="number"
                    value={form.stockQty}
                    onInput={(e) => setForm("stockQty", e.currentTarget.value)}
                    placeholder="Optional"
                  />
                </Field>
                <div class="col-span-2 flex items-end gap-5 pb-1">
                  <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm("inStock", e.currentTarget.checked)}
                    />
                    In stock
                  </label>
                  <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.shoppable}
                      onChange={(e) => setForm("shoppable", e.currentTarget.checked)}
                    />
                    Shoppable
                  </label>
                </div>
              </div>
            </Section>

            {/* ─── retailer ─── */}
            <Section title="Retailer">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Retailer">
                  <SearchableSelect
                    options={retailers() as { _id: string; name: string }[]}
                    value={form.retailer || ""}
                    onChange={(v) => setForm("retailer", v)}
                    placeholder={
                      retailers().length ? "Search retailers…" : "Loading retailers…"
                    }
                    emptyLabel="No retailer"
                  />
                </Field>
                <Field label="White-label retailer">
                  <SearchableSelect
                    options={retailers() as { _id: string; name: string }[]}
                    value={form.whiteLabelRetailer || ""}
                    onChange={(v) => setForm("whiteLabelRetailer", v)}
                    placeholder="Search retailers…"
                    emptyLabel="None"
                  />
                </Field>
                <Field label="Retail link" hint="Generated on save from the asset slug">
                  <input
                    class="input text-muted-foreground"
                    value={form.retailLink || "https://shop.spacejoy.com/product/…"}
                    disabled
                    readOnly
                  />
                </Field>
                <Field label="Wholesale link">
                  <input
                    class="input"
                    value={form.wholesaleLink}
                    onInput={(e) => setForm("wholesaleLink", e.currentTarget.value)}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="White-label product name">
                  <input
                    class="input"
                    value={form.whiteLabelProduct}
                    onInput={(e) => setForm("whiteLabelProduct", e.currentTarget.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </Section>

            {/* ─── dimensions ─── */}
            <Section title="Dimensions & weight">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Width">
                  <input
                    class="input"
                    type="number"
                    value={form.width}
                    onInput={(e) => setForm("width", e.currentTarget.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Height">
                  <input
                    class="input"
                    type="number"
                    value={form.height}
                    onInput={(e) => setForm("height", e.currentTarget.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Depth">
                  <input
                    class="input"
                    type="number"
                    value={form.depth}
                    onInput={(e) => setForm("depth", e.currentTarget.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Unit">
                  <select
                    class="input"
                    value={form.dimensionUnit}
                    onChange={(e) => setForm("dimensionUnit", e.currentTarget.value)}
                  >
                    <option value="inch">inch</option>
                    <option value="ft">ft</option>
                  </select>
                </Field>
                <Field label="Weight">
                  <input
                    class="input"
                    value={form.weight}
                    onInput={(e) => setForm("weight", e.currentTarget.value)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Weight unit">
                  <select
                    class="input"
                    value={form.weightUnit}
                    onChange={(e) => setForm("weightUnit", e.currentTarget.value)}
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </select>
                </Field>
                <div class="col-span-2">
                  <Field label="Other dimensions">
                    <input
                      class="input"
                      value={form.otherDimensions}
                      onInput={(e) => setForm("otherDimensions", e.currentTarget.value)}
                      placeholder="Free text, e.g. seat height 18in"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* ─── properties ─── */}
            <Section
              title="Properties"
              description="Comma-separated. These feed the search map, so the more accurate they are the better the asset ranks in search."
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Colours">
                  <input
                    class="input"
                    value={form.colors}
                    onInput={(e) => setForm("colors", e.currentTarget.value)}
                    placeholder="teal, dark green"
                  />
                </Field>
                <Field label="Material">
                  <input
                    class="input"
                    value={form.material}
                    onInput={(e) => setForm("material", e.currentTarget.value)}
                    placeholder="velvet, upholstered fabric"
                  />
                </Field>
                <Field label="Design style">
                  <input
                    class="input"
                    value={form.designStyle}
                    onInput={(e) => setForm("designStyle", e.currentTarget.value)}
                    placeholder="modern, contemporary"
                  />
                </Field>
                <Field label="Tags">
                  <input
                    class="input"
                    value={form.tags}
                    onInput={(e) => setForm("tags", e.currentTarget.value)}
                    placeholder="chaise lounge, accent seating"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* ─── actions ─── */}
          <div class="sticky bottom-0 -mx-1 px-1 py-3 bg-background/85 backdrop-blur border-t border-border flex items-center justify-between gap-4">
            <p class="text-xs text-destructive">{error()}</p>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                onClick={() => navigate("/asset-management")}
                disabled={saving()}
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" disabled={saving()}>
                {saving()
                  ? isEdit()
                    ? "Saving…"
                    : "Creating…"
                  : isEdit()
                    ? "Save Changes"
                    : "Create Asset"}
              </button>
            </div>
          </div>

          <Show when={toast()}>
            <SuccessToast message={toast()} onClose={() => setToast("")} />
          </Show>
        </form>
      </Show>
    </Show>
  );
}
