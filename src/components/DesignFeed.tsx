import { createIntersectionObserver } from "@solid-primitives/intersection-observer";
import { A } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { fetchDesigns } from "~/lib/designApi";
import type { Design } from "~/lib/types";

const IMAGE_BASE_URL = "https://ik.imagekit.io/spacejoy";

function designImageUrl(design: Design) {
  const firstImage = design.designImages[0];
  const cleanCdnPath = firstImage.cdn.startsWith("/")
    ? firstImage.cdn.slice(1)
    : firstImage.cdn;
  return `${IMAGE_BASE_URL}/${cleanCdnPath}`;
}

function designTitle(design: Design) {
  if (
    typeof design.project === "object" &&
    design.project !== null &&
    "user" in design.project
  ) {
    const userName = design.project.user?.profile?.name;
    if (userName) return `${userName}'s ${design.roomType} Design`;
  }
  return design.title || `${design.roomType} Design`;
}

export default function DesignFeed() {
  const [designs, setDesigns] = createSignal<Design[]>([]);
  const [skip, setSkip] = createSignal(0);
  const [hasMore, setHasMore] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(false);
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
  );

  const loadMoreDesigns = async () => {
    if (isLoading() || !hasMore()) return;

    setIsLoading(true);
    try {
      const newDesigns = await fetchDesigns(skip());
      if (newDesigns.length === 0) {
        setHasMore(false);
      } else {
        setDesigns((prev) => {
          const existingIds = new Set(prev.map((d) => d._id));
          const uniqueNewDesigns = newDesigns.filter(
            (d) => !existingIds.has(d._id),
          );
          return [...prev, ...uniqueNewDesigns];
        });
        setSkip((prev) => prev + 10);
      }
    } catch (error) {
      /* swallowed, same as before */
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    if (inView()) loadMoreDesigns();
  });

  return (
    <div class="animate-fade-in">
      {/* Page header */}
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-foreground tracking-tight">AI Designs</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Browse AI-generated interior design concepts
        </p>
      </div>

      {/* Grid */}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <For each={designs()}>
          {(design) => (
            <Show when={design.designImages[0]}>
              <A
                href={`/design/${design._id}`}
                class="card card-interactive group overflow-hidden"
              >
                <div class="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={designImageUrl(design)}
                    alt={designTitle(design)}
                    loading="lazy"
                    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div class="absolute top-3 left-3">
                    <span class="badge badge-primary text-xs backdrop-blur-sm bg-primary/80 text-white border-0">
                      {design.roomType}
                    </span>
                  </div>
                </div>

                <div class="p-4">
                  <h2 class="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {designTitle(design)}
                  </h2>
                  <Show when={design.intent.secondary}>
                    <p class="text-xs text-muted-foreground line-clamp-1 mt-1.5">
                      {design.intent.secondary}
                    </p>
                  </Show>
                </div>
              </A>
            </Show>
          )}
        </For>
      </div>

      {/* Load more */}
      <Show when={hasMore()}>
        <div ref={setSentinel} class="flex justify-center py-12">
          <Show when={isLoading()} fallback={<div class="h-10" />}>
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span class="text-sm text-muted-foreground">Loading designs...</span>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!hasMore() && designs().length > 0}>
        <div class="text-center py-12 border-t border-border mt-6">
          <p class="text-sm text-muted-foreground">All designs loaded</p>
        </div>
      </Show>
    </div>
  );
}
