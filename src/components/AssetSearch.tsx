import { createIntersectionObserver } from "@solid-primitives/intersection-observer";
import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import {
  emptyAssetFilters,
  fetchAllRetailers,
  fetchTaxonomy,
  searchAssets,
  type AssetSearchFilters,
  type AssetSearchResult,
  type AssetSortKey,
  type Taxonomy,
} from "~/lib/assetApi";
import type { Retailer } from "~/lib/types";

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

const ChevronDown = (props: { open?: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={`shrink-0 opacity-50 transition-transform duration-200 ${props.open ? "rotate-180" : ""}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CloseIcon = (props: { size?: number }) => (
  <svg
    width={props.size ?? 12}
    height={props.size ?? 12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/* ─────────────────────── filter-bar primitives ─────────────────────── */

// one dropdown in the filter bar. `value` is the summary shown on the trigger
// once something is selected, which is what keeps the bar readable at a glance.
function FilterDropdown(props: {
  id: string;
  label: string;
  value?: string;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  onClear?: () => void;
  width?: string;
  children: JSX.Element;
}) {
  const open = () => props.openId === props.id;
  const active = () => !!props.value;

  return (
    <div class="relative">
      <button
        type="button"
        onClick={() => props.setOpenId(open() ? null : props.id)}
        class={`h-9 pl-3 pr-2.5 inline-flex items-center gap-1.5 rounded-lg border text-[13px] whitespace-nowrap transition-colors ${
          active()
            ? "border-foreground/25 bg-secondary text-foreground font-medium"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
        }`}
      >
        <span>{props.label}</span>
        <Show when={active()}>
          <span class="max-w-[130px] truncate text-foreground">· {props.value}</span>
        </Show>
        <Show
          when={active() && props.onClear}
          fallback={<ChevronDown open={open()} />}
        >
          <span
            role="button"
            tabindex={-1}
            onClick={(e) => {
              e.stopPropagation();
              props.onClear!();
            }}
            class="ml-0.5 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <CloseIcon size={11} />
          </span>
        </Show>
      </button>

      <Show when={open()}>
        <div class="fixed inset-0 z-40" onClick={() => props.setOpenId(null)} />
        <div
          class={`absolute left-0 top-full mt-2 z-50 ${props.width ?? "w-72"} rounded-xl border border-border bg-card shadow-lg animate-fade-in-scale`}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
}

// single-select list with an optional type-ahead, used for the taxonomy pickers
function OptionList(props: {
  options: { _id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = createSignal("");
  const visible = () =>
    query().trim()
      ? props.options.filter((o) =>
          o.name?.toLowerCase().includes(query().trim().toLowerCase()),
        )
      : props.options;

  return (
    <div class="p-1.5">
      <Show when={props.searchable}>
        <input
          autofocus
          class="input h-8 text-[13px] mb-1.5"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder={props.searchPlaceholder || "Search…"}
        />
      </Show>
      <div class="max-h-64 overflow-y-auto">
        <button
          type="button"
          onClick={() => props.onChange("")}
          class={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
            !props.value
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {props.allLabel}
        </button>
        <For each={visible()}>
          {(option) => (
            <button
              type="button"
              onClick={() => props.onChange(option._id)}
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
  );
}

function Field(props: { label: string; children: JSX.Element }) {
  return (
    <div class="space-y-1.5">
      <label class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {props.label}
      </label>
      {props.children}
    </div>
  );
}

function RangeRow(props: {
  min: string;
  max: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
}) {
  return (
    <div class="flex items-center gap-1.5">
      <input
        class="input h-9 text-[13px]"
        type="number"
        value={props.min}
        onInput={(e) => props.setMin(e.currentTarget.value)}
        placeholder="Min"
      />
      <span class="text-muted-foreground/40 text-xs shrink-0">–</span>
      <input
        class="input h-9 text-[13px]"
        type="number"
        value={props.max}
        onInput={(e) => props.setMax(e.currentTarget.value)}
        placeholder="Max"
      />
    </div>
  );
}

function Segmented<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div class="flex p-0.5 rounded-lg bg-muted">
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            onClick={() => props.onChange(option.value)}
            class={`flex-1 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              props.value === option.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}

/* ──────────────────────────── main component ──────────────────────────── */

export default function AssetSearch() {
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = createSignal<Taxonomy>({
    categories: [],
    subcategories: [],
    verticals: [],
  });
  const [retailers, setRetailers] = createSignal<Retailer[]>([]);
  const [openId, setOpenId] = createSignal<string | null>(null);

  const [searchText, setSearchText] = createSignal("");
  const [sort, setSort] = createSignal<AssetSortKey>("newest");
  const [wholesale, setWholesale] = createSignal(false);

  // ─── filter state ───
  const [category, setCategory] = createSignal("");
  const [subcategory, setSubcategory] = createSignal("");
  const [vertical, setVertical] = createSignal("");
  const [selectedRetailers, setSelectedRetailers] = createSignal<string[]>([]);
  const [retailerQuery, setRetailerQuery] = createSignal("");
  const [status, setStatus] = createSignal("");
  const [country, setCountry] = createSignal("");
  const [inStock, setInStock] = createSignal<AssetSearchFilters["inStock"]>("all");
  const [priceMin, setPriceMin] = createSignal("");
  const [priceMax, setPriceMax] = createSignal("");
  const [widthMin, setWidthMin] = createSignal("");
  const [widthMax, setWidthMax] = createSignal("");
  const [heightMin, setHeightMin] = createSignal("");
  const [heightMax, setHeightMax] = createSignal("");
  const [depthMin, setDepthMin] = createSignal("");
  const [depthMax, setDepthMax] = createSignal("");
  const [colors, setColors] = createSignal("");
  const [material, setMaterial] = createSignal("");
  const [designStyle, setDesignStyle] = createSignal("");
  const [tags, setTags] = createSignal("");
  const [sku, setSku] = createSignal("");

  // ─── results ───
  const [assets, setAssets] = createSignal<AssetSearchResult[]>([]);
  const [count, setCount] = createSignal(0);
  const [page, setPage] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [error, setError] = createSignal("");
  const [searched, setSearched] = createSignal(false);

  onMount(() => {
    fetchTaxonomy().then(setTaxonomy);
    fetchAllRetailers().then(setRetailers);
  });

  // subcategories/verticals cascade off the parent selection
  const subcategoryOptions = createMemo(() =>
    category()
      ? taxonomy().subcategories.filter((s) => String(s.category) === category())
      : taxonomy().subcategories,
  );

  const verticalOptions = createMemo(() => {
    let list = taxonomy().verticals;
    if (subcategory()) {
      list = list.filter((v) => String(v.subcategory) === subcategory());
    } else if (category()) {
      list = list.filter((v) => String(v.category) === category());
    }
    return list;
  });

  const retailerOptions = createMemo(() => {
    const query = retailerQuery().trim().toLowerCase();
    if (!query) return retailers();
    return retailers().filter((r) => r.name?.toLowerCase().includes(query));
  });

  const buildFilters = (): AssetSearchFilters => {
    const filters = emptyAssetFilters();
    if (category()) filters.category = [category()];
    if (subcategory()) filters.subcategory = [subcategory()];
    if (vertical()) filters.vertical = [vertical()];
    if (selectedRetailers().length) filters.retailer = selectedRetailers();
    if (status()) filters.status = [status()];
    if (country()) filters.country = [country()];
    if (sku().trim()) filters.sku = [sku().trim()];
    filters.colors = toList(colors());
    filters.material = toList(material());
    filters.designStyle = toList(designStyle());
    filters.tags = toList(tags());
    filters.price = toRange(priceMin(), priceMax());
    filters.width = toRange(widthMin(), widthMax());
    filters.height = toRange(heightMin(), heightMax());
    filters.depth = toRange(depthMin(), depthMax());
    filters.inStock = inStock();
    return filters;
  };

  // page 0 replaces the grid, later pages append to it
  const runSearch = async (nextPage: number) => {
    if (nextPage === 0) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const result = await searchAssets({
        filters: buildFilters(),
        searchText: searchText(),
        sort: sort(),
        wholesale: wholesale(),
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
  };

  // filters apply themselves — debounced so typing doesn't fire a request per key
  const filterSignature = createMemo(() =>
    JSON.stringify({
      f: buildFilters(),
      searchText: searchText().trim(),
      sort: sort(),
      wholesale: wholesale(),
    }),
  );

  createEffect(() => {
    filterSignature();
    const timer = setTimeout(() => runSearch(0), 350);
    onCleanup(() => clearTimeout(timer));
  });

  // ─── infinite scroll ───
  const hasMore = () => assets().length < count();
  const [inView, setInView] = createSignal(false);
  const [sentinel, setSentinel] = createSignal<HTMLDivElement>();

  createIntersectionObserver(
    () => {
      const el = sentinel();
      return el ? [el] : [];
    },
    (entries) => {
      for (const entry of entries) setInView(entry.isIntersecting);
    },
    { rootMargin: "400px" },
  );

  createEffect(() => {
    if (inView() && hasMore() && !loading() && !loadingMore() && !error()) {
      runSearch(page() + 1);
    }
  });

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
  const priceLabel = () =>
    priceMin() || priceMax() ? `$${priceMin() || "0"}–${priceMax() || "∞"}` : undefined;

  const retailerLabel = () =>
    selectedRetailers().length === 1
      ? nameOf(retailers(), selectedRetailers()[0])
      : selectedRetailers().length > 1
        ? `${selectedRetailers().length} selected`
        : undefined;

  const moreCount = () =>
    [
      status(),
      country(),
      inStock() !== "all" ? "1" : "",
      sku().trim(),
      widthMin() || widthMax(),
      heightMin() || heightMax(),
      depthMin() || depthMax(),
      colors().trim(),
      material().trim(),
      designStyle().trim(),
      tags().trim(),
      wholesale() ? "1" : "",
    ].filter(Boolean).length;

  // ─── active filter chips ───
  const activeChips = createMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    const push = (key: string, label: string, clear: () => void) =>
      chips.push({ key, label, clear });

    if (category())
      push("category", nameOf(taxonomy().categories, category()), () => {
        setCategory("");
        setSubcategory("");
        setVertical("");
      });
    if (subcategory())
      push("subcategory", nameOf(taxonomy().subcategories, subcategory()), () => {
        setSubcategory("");
        setVertical("");
      });
    if (vertical())
      push("vertical", nameOf(taxonomy().verticals, vertical()), () => setVertical(""));
    selectedRetailers().forEach((id) =>
      push(`retailer-${id}`, nameOf(retailers(), id), () => toggleRetailer(id)),
    );
    if (priceMin() || priceMax())
      push("price", `$${priceMin() || 0} – ${priceMax() || "∞"}`, () => {
        setPriceMin("");
        setPriceMax("");
      });
    if (status()) push("status", status(), () => setStatus(""));
    if (country()) push("country", country(), () => setCountry(""));
    if (inStock() !== "all")
      push("inStock", inStock() === "inStock" ? "In stock" : "Out of stock", () =>
        setInStock("all"),
      );
    if (widthMin() || widthMax())
      push("width", `W ${widthMin() || 0}–${widthMax() || "∞"}`, () => {
        setWidthMin("");
        setWidthMax("");
      });
    if (heightMin() || heightMax())
      push("height", `H ${heightMin() || 0}–${heightMax() || "∞"}`, () => {
        setHeightMin("");
        setHeightMax("");
      });
    if (depthMin() || depthMax())
      push("depth", `D ${depthMin() || 0}–${depthMax() || "∞"}`, () => {
        setDepthMin("");
        setDepthMax("");
      });
    toList(colors()).forEach((c) =>
      push(`color-${c}`, c, () =>
        setColors(
          toList(colors())
            .filter((i) => i !== c)
            .join(", "),
        ),
      ),
    );
    toList(material()).forEach((m) =>
      push(`material-${m}`, m, () =>
        setMaterial(
          toList(material())
            .filter((i) => i !== m)
            .join(", "),
        ),
      ),
    );
    toList(designStyle()).forEach((d) =>
      push(`style-${d}`, d, () =>
        setDesignStyle(
          toList(designStyle())
            .filter((i) => i !== d)
            .join(", "),
        ),
      ),
    );
    toList(tags()).forEach((t) =>
      push(`tag-${t}`, t, () =>
        setTags(
          toList(tags())
            .filter((i) => i !== t)
            .join(", "),
        ),
      ),
    );
    if (sku().trim()) push("sku", `SKU ${sku().trim()}`, () => setSku(""));
    if (wholesale()) push("wholesale", "Wholesale only", () => setWholesale(false));
    return chips;
  });

  return (
    <div class="space-y-5">
      {/* ─── toolbar ─── */}
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative flex-1 min-w-56">
            <svg
              class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              class="input h-10 text-sm"
              style={{ "padding-left": "2.75rem" }}
              placeholder="Search assets by name, colour, tag…"
              value={searchText()}
              onInput={(e) => setSearchText(e.currentTarget.value)}
            />
            <Show when={searchText()}>
              <button
                type="button"
                onClick={() => setSearchText("")}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <CloseIcon size={14} />
              </button>
            </Show>
          </div>

          <div class="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <For each={SORT_OPTIONS}>
              {(option) => (
                <button
                  type="button"
                  onClick={() => setSort(option.value)}
                  class={`px-2.5 h-8 rounded-md text-[12px] font-medium transition-colors ${
                    sort() === option.value
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* ─── filter bar ─── */}
        <div class="flex flex-wrap items-center gap-2">
          <FilterDropdown
            id="category"
            label="Category"
            value={category() ? nameOf(taxonomy().categories, category()) : undefined}
            openId={openId()}
            setOpenId={setOpenId}
            onClear={() => {
              setCategory("");
              setSubcategory("");
              setVertical("");
            }}
          >
            <OptionList
              options={taxonomy().categories}
              value={category()}
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
              subcategory() ? nameOf(taxonomy().subcategories, subcategory()) : undefined
            }
            openId={openId()}
            setOpenId={setOpenId}
            onClear={() => {
              setSubcategory("");
              setVertical("");
            }}
          >
            <OptionList
              options={subcategoryOptions()}
              value={subcategory()}
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
            value={vertical() ? nameOf(taxonomy().verticals, vertical()) : undefined}
            openId={openId()}
            setOpenId={setOpenId}
            onClear={() => setVertical("")}
          >
            <OptionList
              options={verticalOptions()}
              value={vertical()}
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
            value={priceLabel()}
            openId={openId()}
            setOpenId={setOpenId}
            onClear={() => {
              setPriceMin("");
              setPriceMax("");
            }}
            width="w-64"
          >
            <div class="p-3 space-y-3">
              <div class="grid grid-cols-2 gap-1.5">
                <For each={PRICE_PRESETS}>
                  {(preset) => {
                    const active = () =>
                      priceMin() === preset.min && priceMax() === preset.max;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setPriceMin(preset.min);
                          setPriceMax(preset.max);
                        }}
                        class={`px-2 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                          active()
                            ? "border-foreground/25 bg-secondary text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  }}
                </For>
              </div>
              <Field label="Custom range">
                <RangeRow
                  min={priceMin()}
                  max={priceMax()}
                  setMin={setPriceMin}
                  setMax={setPriceMax}
                />
              </Field>
            </div>
          </FilterDropdown>

          <FilterDropdown
            id="retailer"
            label="Retailer"
            value={retailerLabel()}
            openId={openId()}
            setOpenId={setOpenId}
            onClear={() => setSelectedRetailers([])}
          >
            <div class="p-1.5">
              <input
                autofocus
                class="input h-8 text-[13px] mb-1.5"
                value={retailerQuery()}
                onInput={(e) => setRetailerQuery(e.currentTarget.value)}
                placeholder="Find a retailer…"
              />
              <div class="max-h-64 overflow-y-auto">
                <Show when={retailers().length === 0}>
                  <p class="px-2.5 py-3 text-[12px] text-muted-foreground">
                    Loading retailers…
                  </p>
                </Show>
                <For each={retailerOptions()}>
                  {(r) => {
                    const active = () => selectedRetailers().includes(r._id);
                    return (
                      <button
                        type="button"
                        onClick={() => toggleRetailer(r._id)}
                        class={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
                          active()
                            ? "bg-secondary text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span
                          class={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            active()
                              ? "bg-foreground border-foreground text-background"
                              : "border-border"
                          }`}
                        >
                          <Show when={active()}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </Show>
                        </span>
                        <span class="truncate">{r.name}</span>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
          </FilterDropdown>

          <FilterDropdown
            id="more"
            label="More filters"
            value={moreCount() ? `${moreCount()}` : undefined}
            openId={openId()}
            setOpenId={setOpenId}
            width="w-[420px]"
          >
            <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div class="grid grid-cols-2 gap-3">
                <Field label="Stock">
                  <Segmented
                    value={inStock()}
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
                    class="input h-9 text-[13px]"
                    value={sku()}
                    onInput={(e) => setSku(e.currentTarget.value)}
                    placeholder="Exact SKU"
                  />
                </Field>
                <Field label="Status">
                  <select
                    class="input h-9 text-[13px]"
                    value={status()}
                    onChange={(e) => setStatus(e.currentTarget.value)}
                  >
                    <option value="">Any status</option>
                    <For each={STATUS_OPTIONS}>
                      {(s) => <option value={s}>{s}</option>}
                    </For>
                  </select>
                </Field>
                <Field label="Country">
                  <select
                    class="input h-9 text-[13px]"
                    value={country()}
                    onChange={(e) => setCountry(e.currentTarget.value)}
                  >
                    <option value="">US only</option>
                    <For each={COUNTRY_OPTIONS}>
                      {(c) => <option value={c}>{c}</option>}
                    </For>
                  </select>
                </Field>
              </div>

              <div class="border-t border-border pt-3 space-y-3">
                <Field label="Width">
                  <RangeRow
                    min={widthMin()}
                    max={widthMax()}
                    setMin={setWidthMin}
                    setMax={setWidthMax}
                  />
                </Field>
                <Field label="Height">
                  <RangeRow
                    min={heightMin()}
                    max={heightMax()}
                    setMin={setHeightMin}
                    setMax={setHeightMax}
                  />
                </Field>
                <Field label="Depth">
                  <RangeRow
                    min={depthMin()}
                    max={depthMax()}
                    setMin={setDepthMin}
                    setMax={setDepthMax}
                  />
                </Field>
              </div>

              <div class="border-t border-border pt-3 space-y-3">
                <p class="text-[11px] text-muted-foreground/70">
                  Comma-separated — matched against the asset properties.
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <Field label="Colours">
                    <input
                      class="input h-9 text-[13px]"
                      value={colors()}
                      onInput={(e) => setColors(e.currentTarget.value)}
                      placeholder="blue, grey"
                    />
                  </Field>
                  <Field label="Material">
                    <input
                      class="input h-9 text-[13px]"
                      value={material()}
                      onInput={(e) => setMaterial(e.currentTarget.value)}
                      placeholder="velvet, oak"
                    />
                  </Field>
                  <Field label="Design style">
                    <input
                      class="input h-9 text-[13px]"
                      value={designStyle()}
                      onInput={(e) => setDesignStyle(e.currentTarget.value)}
                      placeholder="modern, rustic"
                    />
                  </Field>
                  <Field label="Tags">
                    <input
                      class="input h-9 text-[13px]"
                      value={tags()}
                      onInput={(e) => setTags(e.currentTarget.value)}
                      placeholder="sofa, lounge"
                    />
                  </Field>
                </div>
              </div>

              <label class="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer border-t border-border pt-3">
                <input
                  type="checkbox"
                  checked={wholesale()}
                  onChange={(e) => setWholesale(e.currentTarget.checked)}
                />
                Wholesale retailers only
              </label>
            </div>
          </FilterDropdown>

          <Show when={activeChips().length > 0}>
            <button
              type="button"
              onClick={handleReset}
              class="h-9 px-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </Show>
        </div>

        {/* ─── active filter chips ─── */}
        <Show when={activeChips().length > 0}>
          <div class="flex flex-wrap items-center gap-1.5">
            <For each={activeChips()}>
              {(chip) => (
                <button
                  type="button"
                  onClick={chip.clear}
                  class="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[12px] font-medium hover:bg-muted transition-colors"
                >
                  {chip.label}
                  <span class="opacity-40 group-hover:opacity-100 transition-opacity">
                    <CloseIcon size={11} />
                  </span>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* ─── result meta ─── */}
      <div class="flex items-end justify-between border-b border-border pb-3">
        <p class="text-sm font-medium text-foreground">
          {loading()
            ? "Searching…"
            : `${count().toLocaleString()} asset${count() === 1 ? "" : "s"}`}
        </p>
        <Show when={!loading() && assets().length > 0}>
          <p class="text-xs text-muted-foreground">
            Showing {assets().length.toLocaleString()}
          </p>
        </Show>
      </div>

      <Show when={error()}>
        <p class="text-sm text-destructive">{error()}</p>
      </Show>

      {/* ─── results ─── */}
      <Show
        when={!loading()}
        fallback={
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
            <For each={Array.from({ length: 8 })}>
              {() => (
                <div class="space-y-3">
                  <div class="skeleton aspect-square rounded-xl" />
                  <div class="skeleton h-3 w-1/3 rounded" />
                  <div class="skeleton h-3.5 w-4/5 rounded" />
                  <div class="skeleton h-3.5 w-1/4 rounded" />
                </div>
              )}
            </For>
          </div>
        }
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          <For each={assets()}>
            {(asset) => (
              <a
                href={asset.retailLink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                class="group flex flex-col gap-2.5"
              >
                <div class="relative aspect-square overflow-hidden rounded-xl bg-white border border-border/60 group-hover:border-foreground/15 transition-colors">
                  <Show
                    when={asset.imageUrl}
                    fallback={
                      <div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    }
                  >
                    <img
                      src={asset.imageUrl!}
                      alt={asset.name}
                      loading="lazy"
                      class="absolute inset-0 w-full h-full object-contain p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  </Show>
                  <Show when={asset.inStock === false}>
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur text-[10px] font-medium text-destructive border border-border">
                      Out of stock
                    </span>
                  </Show>

                  {/* the card itself is the retailer link, so editing has to opt out of it */}
                  <button
                    type="button"
                    title="Edit asset"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/asset-management/${asset._id}/edit`);
                    }}
                    class="absolute top-2 right-2 h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur border border-border text-[11px] font-medium text-foreground opacity-0 group-hover:opacity-100 hover:bg-card transition-opacity"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Edit
                  </button>
                </div>

                <div class="space-y-1">
                  <p class="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    {asset.retailer || "—"}
                  </p>
                  <h4 class="text-[13px] font-medium text-foreground line-clamp-2 leading-snug group-hover:underline underline-offset-2">
                    {asset.name}
                  </h4>
                  <div class="flex items-baseline gap-2 pt-0.5">
                    <span class="text-[15px] font-semibold text-foreground">
                      ${Number(asset.price || 0).toLocaleString()}
                    </span>
                    <Show when={!!asset.msrp && asset.msrp > asset.price}>
                      <span class="text-[12px] text-muted-foreground/70 line-through">
                        ${Number(asset.msrp).toLocaleString()}
                      </span>
                    </Show>
                  </div>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>

      <Show when={!loading() && searched() && assets().length === 0 && !error()}>
        <div class="py-20 text-center space-y-3">
          <p class="text-sm text-muted-foreground">No assets matched these filters.</p>
          <Show when={activeChips().length > 0}>
            <button onClick={handleReset} class="btn btn-secondary btn-sm">
              Clear all filters
            </button>
          </Show>
        </div>
      </Show>

      {/* infinite-scroll sentinel — fires the next page 400px before it lands */}
      <Show when={hasMore() && !loading() && !error()}>
        <div ref={setSentinel} class="py-8 flex justify-center">
          <Show when={loadingMore()}>
            <span class="text-xs text-muted-foreground">Loading more…</span>
          </Show>
        </div>
      </Show>

      <Show when={!hasMore() && assets().length > 0 && !loading()}>
        <p class="py-8 text-center text-xs text-muted-foreground/60">End of results</p>
      </Show>
    </div>
  );
}
