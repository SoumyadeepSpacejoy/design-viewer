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
import { useInView } from "react-intersection-observer";
import {
  AssetSearchFilters,
  AssetSearchResult,
  AssetSortKey,
  Taxonomy,
  emptyAssetFilters,
  fetchAllRetailers,
  fetchTaxonomy,
  searchAssets,
} from "@/app/assetApi";
import { Retailer } from "@/app/types";

const PAGE_SIZE = 20;

// mirrors Constants.Status on the asset schema
const STATUS_OPTIONS = [
  "active",
  "pending",
  "suspended",
  "closed",
  "inactive",
  "discontinued",
];
const COUNTRY_OPTIONS = ["USA", "UAE", "CAN"];

const SORT_OPTIONS: { value: AssetSortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priceAsc", label: "Price ↑" },
  { value: "priceDesc", label: "Price ↓" },
];

const PRICE_PRESETS = [
  { label: "Under $100", min: "", max: "100" },
  { label: "$100 – $500", min: "100", max: "500" },
  { label: "$500 – $1000", min: "500", max: "1000" },
  { label: "Over $1000", min: "1000", max: "" },
];

// filters.colors / material / designStyle / tags are matched against the
// properties.* strings, which are themselves comma-separated lists
const toList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toRange = (min: string, max: string) => {
  if (!min && !max) return null;
  return { start: Number(min) || 0, end: Number(max) || 1000000 };
};

const ChevronDown = ({ open }: { open?: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CloseIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/* ─────────────────────── filter-bar primitives ─────────────────────── */

// one dropdown in the filter bar. `value` is the summary shown on the trigger
// once something is selected, which is what keeps the bar readable at a glance.
function FilterDropdown({
  id,
  label,
  value,
  openId,
  setOpenId,
  onClear,
  width = "w-72",
  children,
}: {
  id: string;
  label: string;
  value?: string;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  onClear?: () => void;
  width?: string;
  children: ReactNode;
}) {
  const open = openId === id;
  const active = !!value;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className={`h-9 pl-3 pr-2.5 inline-flex items-center gap-1.5 rounded-lg border text-[13px] whitespace-nowrap transition-colors ${
          active
            ? "border-foreground/25 bg-secondary text-foreground font-medium"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
        }`}
      >
        <span>{label}</span>
        {active && (
          <span className="max-w-[130px] truncate text-foreground">
            · {value}
          </span>
        )}
        {active && onClear ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="ml-0.5 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <CloseIcon size={11} />
          </span>
        ) : (
          <ChevronDown open={open} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenId(null)} />
          <div
            className={`absolute left-0 top-full mt-2 z-50 ${width} rounded-xl border border-border bg-card shadow-lg animate-fade-in-scale`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// single-select list with an optional type-ahead, used for the taxonomy pickers
function OptionList({
  options,
  value,
  onChange,
  allLabel,
  searchable,
  searchPlaceholder,
}: {
  options: { _id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const visible = query.trim()
    ? options.filter((o) =>
        o.name?.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  return (
    <div className="p-1.5">
      {searchable && (
        <input
          autoFocus
          className="input h-8 text-[13px] mb-1.5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder || "Search…"}
        />
      )}
      <div className="max-h-64 overflow-y-auto">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
            !value
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {allLabel}
        </button>
        {visible.map((option) => (
          <button
            key={option._id}
            type="button"
            onClick={() => onChange(option._id)}
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
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function RangeRow({
  min,
  max,
  setMin,
  setMax,
}: {
  min: string;
  max: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        className="input h-9 text-[13px]"
        type="number"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        placeholder="Min"
      />
      <span className="text-muted-foreground/40 text-xs shrink-0">–</span>
      <input
        className="input h-9 text-[13px]"
        type="number"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        placeholder="Max"
      />
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex p-0.5 rounded-lg bg-muted">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all ${
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────── main component ──────────────────────────── */

export default function AssetSearch() {
  const router = useRouter();
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    categories: [],
    subcategories: [],
    verticals: [],
  });
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<AssetSortKey>("newest");
  const [wholesale, setWholesale] = useState(false);

  // ─── filter state ───
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [vertical, setVertical] = useState("");
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [retailerQuery, setRetailerQuery] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [inStock, setInStock] = useState<AssetSearchFilters["inStock"]>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [widthMin, setWidthMin] = useState("");
  const [widthMax, setWidthMax] = useState("");
  const [heightMin, setHeightMin] = useState("");
  const [heightMax, setHeightMax] = useState("");
  const [depthMin, setDepthMin] = useState("");
  const [depthMax, setDepthMax] = useState("");
  const [colors, setColors] = useState("");
  const [material, setMaterial] = useState("");
  const [designStyle, setDesignStyle] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");

  // ─── results ───
  const [assets, setAssets] = useState<AssetSearchResult[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchTaxonomy().then(setTaxonomy);
    fetchAllRetailers().then(setRetailers);
  }, []);

  // subcategories/verticals cascade off the parent selection
  const subcategoryOptions = useMemo(
    () =>
      category
        ? taxonomy.subcategories.filter((s) => String(s.category) === category)
        : taxonomy.subcategories,
    [taxonomy.subcategories, category],
  );

  const verticalOptions = useMemo(() => {
    let list = taxonomy.verticals;
    if (subcategory) {
      list = list.filter((v) => String(v.subcategory) === subcategory);
    } else if (category) {
      list = list.filter((v) => String(v.category) === category);
    }
    return list;
  }, [taxonomy.verticals, category, subcategory]);

  const retailerOptions = useMemo(() => {
    const query = retailerQuery.trim().toLowerCase();
    if (!query) return retailers;
    return retailers.filter((r) => r.name?.toLowerCase().includes(query));
  }, [retailers, retailerQuery]);

  const buildFilters = useCallback((): AssetSearchFilters => {
    const filters = emptyAssetFilters();
    if (category) filters.category = [category];
    if (subcategory) filters.subcategory = [subcategory];
    if (vertical) filters.vertical = [vertical];
    if (selectedRetailers.length) filters.retailer = selectedRetailers;
    if (status) filters.status = [status];
    if (country) filters.country = [country];
    if (sku.trim()) filters.sku = [sku.trim()];
    filters.colors = toList(colors);
    filters.material = toList(material);
    filters.designStyle = toList(designStyle);
    filters.tags = toList(tags);
    filters.price = toRange(priceMin, priceMax);
    filters.width = toRange(widthMin, widthMax);
    filters.height = toRange(heightMin, heightMax);
    filters.depth = toRange(depthMin, depthMax);
    filters.inStock = inStock;
    return filters;
  }, [
    category,
    subcategory,
    vertical,
    selectedRetailers,
    status,
    country,
    sku,
    colors,
    material,
    designStyle,
    tags,
    priceMin,
    priceMax,
    widthMin,
    widthMax,
    heightMin,
    heightMax,
    depthMin,
    depthMax,
    inStock,
  ]);

  // page 0 replaces the grid, later pages append to it
  const runSearch = useCallback(
    async (nextPage: number) => {
      if (nextPage === 0) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const result = await searchAssets({
          filters: buildFilters(),
          searchText,
          sort,
          wholesale,
          limit: PAGE_SIZE,
          skip: nextPage * PAGE_SIZE,
        });
        setAssets((prev) =>
          nextPage === 0 ? result.assets : [...prev, ...result.assets],
        );
        setCount(result.count);
        setPage(nextPage);
        setSearched(true);
      } catch (err) {
        setError((err as Error)?.message || "Search failed");
        if (nextPage === 0) {
          setAssets([]);
          setCount(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildFilters, searchText, sort, wholesale],
  );

  // filters apply themselves — debounced so typing doesn't fire a request per key
  const filterSignature = JSON.stringify({
    f: buildFilters(),
    searchText: searchText.trim(),
    sort,
    wholesale,
  });
  const runSearchRef = useRef(runSearch);
  runSearchRef.current = runSearch;

  useEffect(() => {
    const timer = setTimeout(() => runSearchRef.current(0), 350);
    return () => clearTimeout(timer);
  }, [filterSignature]);

  // ─── infinite scroll ───
  const hasMore = assets.length < count;
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "400px" });

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && !error) {
      runSearchRef.current(page + 1);
    }
  }, [inView, hasMore, loading, loadingMore, error, page]);

  const handleReset = () => {
    setSearchText("");
    setCategory("");
    setSubcategory("");
    setVertical("");
    setSelectedRetailers([]);
    setRetailerQuery("");
    setStatus("");
    setCountry("");
    setInStock("all");
    setPriceMin("");
    setPriceMax("");
    setWidthMin("");
    setWidthMax("");
    setHeightMin("");
    setHeightMax("");
    setDepthMin("");
    setDepthMax("");
    setColors("");
    setMaterial("");
    setDesignStyle("");
    setTags("");
    setSku("");
    setWholesale(false);
  };

  const toggleRetailer = (id: string) => {
    setSelectedRetailers((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const nameOf = (list: { _id: string; name: string }[], id: string): string =>
    list.find((item) => item._id === id)?.name || id;

  // ─── trigger summaries ───
  const priceLabel =
    priceMin || priceMax
      ? `$${priceMin || "0"}–${priceMax || "∞"}`
      : undefined;

  const retailerLabel =
    selectedRetailers.length === 1
      ? nameOf(retailers, selectedRetailers[0])
      : selectedRetailers.length > 1
        ? `${selectedRetailers.length} selected`
        : undefined;

  const moreCount = [
    status,
    country,
    inStock !== "all" ? "1" : "",
    sku.trim(),
    widthMin || widthMax,
    heightMin || heightMax,
    depthMin || depthMax,
    colors.trim(),
    material.trim(),
    designStyle.trim(),
    tags.trim(),
    wholesale ? "1" : "",
  ].filter(Boolean).length;

  // ─── active filter chips ───
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    const push = (key: string, label: string, clear: () => void) =>
      chips.push({ key, label, clear });

    if (category)
      push("category", nameOf(taxonomy.categories, category), () => {
        setCategory("");
        setSubcategory("");
        setVertical("");
      });
    if (subcategory)
      push("subcategory", nameOf(taxonomy.subcategories, subcategory), () => {
        setSubcategory("");
        setVertical("");
      });
    if (vertical)
      push("vertical", nameOf(taxonomy.verticals, vertical), () =>
        setVertical(""),
      );
    selectedRetailers.forEach((id) =>
      push(`retailer-${id}`, nameOf(retailers, id), () => toggleRetailer(id)),
    );
    if (priceMin || priceMax)
      push("price", `$${priceMin || 0} – ${priceMax || "∞"}`, () => {
        setPriceMin("");
        setPriceMax("");
      });
    if (status) push("status", status, () => setStatus(""));
    if (country) push("country", country, () => setCountry(""));
    if (inStock !== "all")
      push("inStock", inStock === "inStock" ? "In stock" : "Out of stock", () =>
        setInStock("all"),
      );
    if (widthMin || widthMax)
      push("width", `W ${widthMin || 0}–${widthMax || "∞"}`, () => {
        setWidthMin("");
        setWidthMax("");
      });
    if (heightMin || heightMax)
      push("height", `H ${heightMin || 0}–${heightMax || "∞"}`, () => {
        setHeightMin("");
        setHeightMax("");
      });
    if (depthMin || depthMax)
      push("depth", `D ${depthMin || 0}–${depthMax || "∞"}`, () => {
        setDepthMin("");
        setDepthMax("");
      });
    toList(colors).forEach((c) =>
      push(`color-${c}`, c, () =>
        setColors(
          toList(colors)
            .filter((i) => i !== c)
            .join(", "),
        ),
      ),
    );
    toList(material).forEach((m) =>
      push(`material-${m}`, m, () =>
        setMaterial(
          toList(material)
            .filter((i) => i !== m)
            .join(", "),
        ),
      ),
    );
    toList(designStyle).forEach((d) =>
      push(`style-${d}`, d, () =>
        setDesignStyle(
          toList(designStyle)
            .filter((i) => i !== d)
            .join(", "),
        ),
      ),
    );
    toList(tags).forEach((t) =>
      push(`tag-${t}`, t, () =>
        setTags(
          toList(tags)
            .filter((i) => i !== t)
            .join(", "),
        ),
      ),
    );
    if (sku.trim()) push("sku", `SKU ${sku.trim()}`, () => setSku(""));
    if (wholesale)
      push("wholesale", "Wholesale only", () => setWholesale(false));
    return chips;
  }, [
    taxonomy,
    retailers,
    category,
    subcategory,
    vertical,
    selectedRetailers,
    status,
    country,
    inStock,
    priceMin,
    priceMax,
    widthMin,
    widthMax,
    heightMin,
    heightMax,
    depthMin,
    depthMax,
    colors,
    material,
    designStyle,
    tags,
    sku,
    wholesale,
  ]);

  return (
    <div className="space-y-5">
      {/* ─── toolbar ─── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              className="input h-10 text-sm"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Search assets by name, colour, tag…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={`px-2.5 h-8 rounded-md text-[12px] font-medium transition-colors ${
                  sort === option.value
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── filter bar ─── */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            id="category"
            label="Category"
            value={category ? nameOf(taxonomy.categories, category) : undefined}
            openId={openId}
            setOpenId={setOpenId}
            onClear={() => {
              setCategory("");
              setSubcategory("");
              setVertical("");
            }}
          >
            <OptionList
              options={taxonomy.categories}
              value={category}
              allLabel="All categories"
              onChange={(v) => {
                setCategory(v);
                setSubcategory("");
                setVertical("");
                setOpenId(null);
              }}
            />
          </FilterDropdown>

          <FilterDropdown
            id="subcategory"
            label="Subcategory"
            value={
              subcategory
                ? nameOf(taxonomy.subcategories, subcategory)
                : undefined
            }
            openId={openId}
            setOpenId={setOpenId}
            onClear={() => {
              setSubcategory("");
              setVertical("");
            }}
          >
            <OptionList
              options={subcategoryOptions}
              value={subcategory}
              allLabel="All subcategories"
              searchable
              searchPlaceholder="Find a subcategory…"
              onChange={(v) => {
                setSubcategory(v);
                setVertical("");
                setOpenId(null);
              }}
            />
          </FilterDropdown>

          <FilterDropdown
            id="vertical"
            label="Vertical"
            value={vertical ? nameOf(taxonomy.verticals, vertical) : undefined}
            openId={openId}
            setOpenId={setOpenId}
            onClear={() => setVertical("")}
          >
            <OptionList
              options={verticalOptions}
              value={vertical}
              allLabel="All verticals"
              searchable
              searchPlaceholder="Find a vertical…"
              onChange={(v) => {
                setVertical(v);
                setOpenId(null);
              }}
            />
          </FilterDropdown>

          <FilterDropdown
            id="price"
            label="Price"
            value={priceLabel}
            openId={openId}
            setOpenId={setOpenId}
            onClear={() => {
              setPriceMin("");
              setPriceMax("");
            }}
            width="w-64"
          >
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const active =
                    priceMin === preset.min && priceMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPriceMin(preset.min);
                        setPriceMax(preset.max);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                        active
                          ? "border-foreground/25 bg-secondary text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <Field label="Custom range">
                <RangeRow
                  min={priceMin}
                  max={priceMax}
                  setMin={setPriceMin}
                  setMax={setPriceMax}
                />
              </Field>
            </div>
          </FilterDropdown>

          <FilterDropdown
            id="retailer"
            label="Retailer"
            value={retailerLabel}
            openId={openId}
            setOpenId={setOpenId}
            onClear={() => setSelectedRetailers([])}
          >
            <div className="p-1.5">
              <input
                autoFocus
                className="input h-8 text-[13px] mb-1.5"
                value={retailerQuery}
                onChange={(e) => setRetailerQuery(e.target.value)}
                placeholder="Find a retailer…"
              />
              <div className="max-h-64 overflow-y-auto">
                {retailers.length === 0 && (
                  <p className="px-2.5 py-3 text-[12px] text-muted-foreground">
                    Loading retailers…
                  </p>
                )}
                {retailerOptions.map((r) => {
                  const active = selectedRetailers.includes(r._id);
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => toggleRetailer(r._id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
                        active
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-foreground border-foreground text-background"
                            : "border-border"
                        }`}
                      >
                        {active && (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </FilterDropdown>

          <FilterDropdown
            id="more"
            label="More filters"
            value={moreCount ? `${moreCount}` : undefined}
            openId={openId}
            setOpenId={setOpenId}
            width="w-[420px]"
          >
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock">
                  <Segmented
                    value={inStock}
                    onChange={setInStock}
                    options={[
                      { value: "all", label: "All" },
                      { value: "inStock", label: "In" },
                      { value: "outOfStock", label: "Out" },
                    ]}
                  />
                </Field>
                <Field label="SKU">
                  <input
                    className="input h-9 text-[13px]"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Exact SKU"
                  />
                </Field>
                <Field label="Status">
                  <select
                    className="input h-9 text-[13px]"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Any status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <select
                    className="input h-9 text-[13px]"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">US only</option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <Field label="Width">
                  <RangeRow
                    min={widthMin}
                    max={widthMax}
                    setMin={setWidthMin}
                    setMax={setWidthMax}
                  />
                </Field>
                <Field label="Height">
                  <RangeRow
                    min={heightMin}
                    max={heightMax}
                    setMin={setHeightMin}
                    setMax={setHeightMax}
                  />
                </Field>
                <Field label="Depth">
                  <RangeRow
                    min={depthMin}
                    max={depthMax}
                    setMin={setDepthMin}
                    setMax={setDepthMax}
                  />
                </Field>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <p className="text-[11px] text-muted-foreground/70">
                  Comma-separated — matched against the asset properties.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Colours">
                    <input
                      className="input h-9 text-[13px]"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                      placeholder="blue, grey"
                    />
                  </Field>
                  <Field label="Material">
                    <input
                      className="input h-9 text-[13px]"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="velvet, oak"
                    />
                  </Field>
                  <Field label="Design style">
                    <input
                      className="input h-9 text-[13px]"
                      value={designStyle}
                      onChange={(e) => setDesignStyle(e.target.value)}
                      placeholder="modern, rustic"
                    />
                  </Field>
                  <Field label="Tags">
                    <input
                      className="input h-9 text-[13px]"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="sofa, lounge"
                    />
                  </Field>
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer border-t border-border pt-3">
                <input
                  type="checkbox"
                  checked={wholesale}
                  onChange={(e) => setWholesale(e.target.checked)}
                />
                Wholesale retailers only
              </label>
            </div>
          </FilterDropdown>

          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* ─── active filter chips ─── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                className="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[12px] font-medium hover:bg-muted transition-colors"
              >
                {chip.label}
                <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                  <CloseIcon size={11} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── result meta ─── */}
      <div className="flex items-end justify-between border-b border-border pb-3">
        <p className="text-sm font-medium text-foreground">
          {loading
            ? "Searching…"
            : `${count.toLocaleString()} asset${count === 1 ? "" : "s"}`}
        </p>
        {!loading && assets.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {assets.length.toLocaleString()}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* ─── results ─── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-square rounded-xl" />
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-3.5 w-4/5 rounded" />
              <div className="skeleton h-3.5 w-1/4 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {assets.map((asset) => (
            <a
              key={asset._id}
              href={asset.retailLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2.5"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-white border border-border/60 group-hover:border-foreground/15 transition-colors">
                {asset.imageUrl ? (
                  <Image
                    src={asset.imageUrl}
                    alt={asset.name}
                    fill
                    unoptimized
                    className="object-contain p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                {asset.inStock === false && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur text-[10px] font-medium text-destructive border border-border">
                    Out of stock
                  </span>
                )}

                {/* the card itself is the retailer link, so editing has to opt out of it */}
                <button
                  type="button"
                  title="Edit asset"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/asset-management/${asset._id}/edit`);
                  }}
                  className="absolute top-2 right-2 h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur border border-border text-[11px] font-medium text-foreground opacity-0 group-hover:opacity-100 hover:bg-card transition-opacity"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Edit
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                  {asset.retailer || "—"}
                </p>
                <h4 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug group-hover:underline underline-offset-2">
                  {asset.name}
                </h4>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="text-[15px] font-semibold text-foreground">
                    ${Number(asset.price || 0).toLocaleString()}
                  </span>
                  {!!asset.msrp && asset.msrp > asset.price && (
                    <span className="text-[12px] text-muted-foreground/70 line-through">
                      ${Number(asset.msrp).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && searched && assets.length === 0 && !error && (
        <div className="py-20 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No assets matched these filters.
          </p>
          {activeChips.length > 0 && (
            <button onClick={handleReset} className="btn btn-secondary btn-sm">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* infinite-scroll sentinel — fires the next page 400px before it lands */}
      {hasMore && !loading && !error && (
        <div ref={sentinelRef} className="py-8 flex justify-center">
          {loadingMore && (
            <span className="text-xs text-muted-foreground">Loading more…</span>
          )}
        </div>
      )}

      {!hasMore && assets.length > 0 && !loading && (
        <p className="py-8 text-center text-xs text-muted-foreground/60">
          End of results
        </p>
      )}
    </div>
  );
}
