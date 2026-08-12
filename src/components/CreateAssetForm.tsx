"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AssetImage,
  CreateAssetInput,
  Taxonomy,
  createAsset,
  fetchAllRetailers,
  fetchAsset,
  fetchTaxonomy,
  updateAsset,
} from "@/app/assetApi";
import { Retailer } from "@/app/types";
import SuccessToast from "./SuccessToast";
import PageLoader from "./PageLoader";

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

// mirrors gcsHelper.extractGcsName on the api — the raw bucket URL is not in
// next.config's remotePatterns, the ImageKit host is
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
}

// retailer lists run into the hundreds, so these get a type-ahead rather than a
// plain <select> you have to scroll
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
}: {
  options: { _id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option._id === value);
  const visible = query.trim()
    ? options.filter((option) =>
        option.name?.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="input flex items-center justify-between text-left"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.name || placeholder}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-lg p-1.5 animate-fade-in-scale">
            <input
              autoFocus
              className="input h-8 text-[13px] mb-1.5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
            />
            <div className="max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                  !value
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {emptyLabel}
              </button>
              {visible.map((option) => (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => {
                    onChange(option._id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                    value === option._id
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {option.name}
                </button>
              ))}
              {visible.length === 0 && (
                <p className="px-2.5 py-3 text-[12px] text-muted-foreground">
                  Nothing matches “{query}”.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CreateAssetForm({ assetId }: { assetId?: string } = {}) {
  const router = useRouter();
  const isEdit = !!assetId;

  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    categories: [],
    subcategories: [],
    verticals: [],
  });
  const [retailers, setRetailers] = useState<Retailer[]>([]);

  const [form, setForm] = useState<CreateAssetInput>({
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
  });

  const [previews, setPreviews] = useState<Preview[]>([]);
  const [keptImages, setKeptImages] = useState<AssetImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!assetId);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTaxonomy().then(setTaxonomy);
    fetchAllRetailers().then(setRetailers);
  }, []);

  // edit mode — hydrate the form from the stored asset
  const loadAsset = useCallback(() => {
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
        });
        setKeptImages(asset.productImages || []);
      })
      .catch((err) =>
        setLoadError((err as Error)?.message || "Failed to load asset"),
      )
      .finally(() => setLoading(false));
  }, [assetId]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  // object URLs are released on unmount (and individually on remove) — revoking
  // whenever `previews` changes would kill the URLs of images still on screen
  const previewsRef = useRef<Preview[]>([]);
  previewsRef.current = previews;
  useEffect(
    () => () =>
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [],
  );

  const set = <K extends keyof CreateAssetInput>(
    key: K,
    value: CreateAssetInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const subcategoryOptions = useMemo(
    () =>
      form.category
        ? taxonomy.subcategories.filter(
            (s) => String(s.category) === form.category,
          )
        : [],
    [taxonomy.subcategories, form.category],
  );

  const verticalOptions = useMemo(
    () =>
      form.subcategory
        ? taxonomy.verticals.filter(
            (v) => String(v.subcategory) === form.subcategory,
          )
        : [],
    [taxonomy.verticals, form.subcategory],
  );

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
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
  const gallery = [
    ...keptImages.map((image, index) => ({
      key: `kept-${image.fileUrl}-${index}`,
      url: toImageKit(image.fileUrl),
      label: "",
      remove: () => removeKeptImage(index),
    })),
    ...previews.map((preview, index) => ({
      key: preview.url,
      url: preview.url,
      label: "NEW",
      remove: () => removeNewImage(index),
    })),
  ];

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.category) next.category = "Category is required.";
    if (!form.subcategory) next.subcategory = "Subcategory is required.";
    if (!form.vertical) next.vertical = "Vertical is required.";
    if (gallery.length === 0) next.images = "At least one image is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const files = previews.map((preview) => preview.file);
      const asset = isEdit
        ? await updateAsset(assetId, form, files, keptImages)
        : await createAsset(form, files);
      setToast(`"${asset.name}" ${isEdit ? "updated" : "created"}`);
      setTimeout(() => router.push("/asset-management"), 900);
    } catch (err) {
      setError(
        (err as Error)?.message ||
          `Failed to ${isEdit ? "update" : "create"} asset`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  // never fall through to an empty form in edit mode — a blank form here reads as
  // "this asset has no data" when the real problem is the fetch
  if (loadError) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <div className="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            Couldn’t load this asset
          </h2>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <p className="text-xs text-muted-foreground/70 pt-1">
            Asset ID: <code>{assetId}</code>
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={loadAsset}
            className="btn btn-primary btn-sm"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/asset-management")}
            className="btn btn-secondary btn-sm"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ─── header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/asset-management")}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Asset Management
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Edit Asset" : "Create Asset"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
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
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
            dragging
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
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <svg
            className="mx-auto mb-2 text-muted-foreground"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p className="text-[13px] text-foreground font-medium leading-snug">
            Drop images or click to browse
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PNG, JPG or WEBP
          </p>
          {errors.images && (
            <p className="text-[11px] text-destructive mt-1.5">
              {errors.images}
            </p>
          )}
        </div>

        {gallery.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-2.5">
            {gallery.map((item, index) => (
              <div
                key={item.key}
                className="relative aspect-square rounded-lg overflow-hidden border border-border bg-white group"
              >
                <Image
                  src={item.url}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain p-1.5"
                />
                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-foreground text-background text-[9px] font-semibold">
                    PRIMARY
                  </span>
                ) : (
                  item.label && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[9px] font-semibold">
                      {item.label}
                    </span>
                  )
                )}
                <button
                  type="button"
                  onClick={item.remove}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </Section>

      {/* the rest pairs up on wide screens so the form fills the viewport
          instead of running as one narrow column */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
      {/* ─── basics ─── */}
      <Section title="Basics">
        <Field label="Name" required error={errors.name}>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Teal Velvet Chaise Lounge"
          />
        </Field>

        <Field label="Description">
          <textarea
            className="input min-h-28 py-2.5"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Product description shown on the asset page."
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Category" required error={errors.category}>
            <select
              className="input"
              value={form.category}
              onChange={(e) => {
                set("category", e.target.value);
                set("subcategory", "");
                set("vertical", "");
              }}
            >
              <option value="">Select…</option>
              {taxonomy.categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subcategory" required error={errors.subcategory}>
            <select
              className="input"
              value={form.subcategory}
              disabled={!form.category}
              onChange={(e) => {
                set("subcategory", e.target.value);
                set("vertical", "");
              }}
            >
              <option value="">
                {form.category ? "Select…" : "Pick a category first"}
              </option>
              {subcategoryOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Vertical" required error={errors.vertical}>
            <select
              className="input"
              value={form.vertical}
              disabled={!form.subcategory}
              onChange={(e) => set("vertical", e.target.value)}
            >
              <option value="">
                {form.subcategory ? "Select…" : "Pick a subcategory first"}
              </option>
              {verticalOptions.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ─── pricing ─── */}
      <Section title="Pricing & availability">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Price">
            <input
              className="input"
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="MSRP" hint="Defaults to price">
            <input
              className="input"
              type="number"
              value={form.msrp}
              onChange={(e) => set("msrp", e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Currency">
            <select
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <select
              className="input"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stock qty">
            <input
              className="input"
              type="number"
              value={form.stockQty}
              onChange={(e) => set("stockQty", e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <div className="col-span-2 flex items-end gap-5 pb-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => set("inStock", e.target.checked)}
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.shoppable}
                onChange={(e) => set("shoppable", e.target.checked)}
              />
              Shoppable
            </label>
          </div>
        </div>
      </Section>

      {/* ─── retailer ─── */}
      <Section title="Retailer">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Retailer">
            <SearchableSelect
              options={retailers as { _id: string; name: string }[]}
              value={form.retailer || ""}
              onChange={(v) => set("retailer", v)}
              placeholder={
                retailers.length ? "Search retailers…" : "Loading retailers…"
              }
              emptyLabel="No retailer"
            />
          </Field>
          <Field label="White-label retailer">
            <SearchableSelect
              options={retailers as { _id: string; name: string }[]}
              value={form.whiteLabelRetailer || ""}
              onChange={(v) => set("whiteLabelRetailer", v)}
              placeholder="Search retailers…"
              emptyLabel="None"
            />
          </Field>
          <Field
            label="Retail link"
            hint="Generated on save from the asset slug"
          >
            <input
              className="input text-muted-foreground"
              value={form.retailLink || "https://shop.spacejoy.com/product/…"}
              disabled
              readOnly
            />
          </Field>
          <Field label="Wholesale link">
            <input
              className="input"
              value={form.wholesaleLink}
              onChange={(e) => set("wholesaleLink", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="White-label product name">
            <input
              className="input"
              value={form.whiteLabelProduct}
              onChange={(e) => set("whiteLabelProduct", e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
      </Section>

      {/* ─── dimensions ─── */}
      <Section title="Dimensions & weight">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Width">
            <input
              className="input"
              type="number"
              value={form.width}
              onChange={(e) => set("width", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Height">
            <input
              className="input"
              type="number"
              value={form.height}
              onChange={(e) => set("height", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Depth">
            <input
              className="input"
              type="number"
              value={form.depth}
              onChange={(e) => set("depth", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Unit">
            <select
              className="input"
              value={form.dimensionUnit}
              onChange={(e) => set("dimensionUnit", e.target.value)}
            >
              <option value="inch">inch</option>
              <option value="ft">ft</option>
            </select>
          </Field>
          <Field label="Weight">
            <input
              className="input"
              value={form.weight}
              onChange={(e) => set("weight", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Weight unit">
            <select
              className="input"
              value={form.weightUnit}
              onChange={(e) => set("weightUnit", e.target.value)}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Other dimensions">
              <input
                className="input"
                value={form.otherDimensions}
                onChange={(e) => set("otherDimensions", e.target.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Colours">
            <input
              className="input"
              value={form.colors}
              onChange={(e) => set("colors", e.target.value)}
              placeholder="teal, dark green"
            />
          </Field>
          <Field label="Material">
            <input
              className="input"
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
              placeholder="velvet, upholstered fabric"
            />
          </Field>
          <Field label="Design style">
            <input
              className="input"
              value={form.designStyle}
              onChange={(e) => set("designStyle", e.target.value)}
              placeholder="modern, contemporary"
            />
          </Field>
          <Field label="Tags">
            <input
              className="input"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="chaise lounge, accent seating"
            />
          </Field>
        </div>
      </Section>
      </div>

      {/* ─── actions ─── */}
      <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-background/85 backdrop-blur border-t border-border flex items-center justify-between gap-4">
        <p className="text-xs text-destructive">{error}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => router.push("/asset-management")}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Asset"}
          </button>
        </div>
      </div>

      {toast && <SuccessToast message={toast} onClose={() => setToast("")} />}
    </form>
  );
}
