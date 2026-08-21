import { createSignal, For, Show } from "solid-js";
import type { DesignImage } from "~/lib/types";
import BeforeAfterSlider from "./BeforeAfterSlider";

const IMAGE_BASE_URL = "https://ik.imagekit.io/spacejoy";

interface DesignImageSliderProps {
  images: DesignImage[];
  beforeImage: string;
}

function imageUrl(img: DesignImage) {
  const clean = img.cdn.startsWith("/") ? img.cdn.slice(1) : img.cdn;
  return `${IMAGE_BASE_URL}/${clean}`;
}

export default function DesignImageSlider(props: DesignImageSliderProps) {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [isComparing, setIsComparing] = createSignal(false);

  const activeImage = () => props.images[activeIndex()];
  const activeImageUrl = () => {
    const img = activeImage();
    return img ? imageUrl(img) : "";
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % props.images.length);
    setIsComparing(false); // Reset comparison mode when changing image
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + props.images.length) % props.images.length);
    setIsComparing(false);
  };

  return (
    <Show when={activeImage()}>
      <div class="space-y-4">
        <div class="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-card-border">
          <Show
            when={isComparing()}
            fallback={
              <img
                src={activeImageUrl()}
                alt={`Design view ${activeIndex() + 1}`}
                class="absolute inset-0 w-full h-full object-cover"
              />
            }
          >
            <BeforeAfterSlider
              beforeImage={props.beforeImage}
              afterImage={activeImageUrl()}
              alt="Room Design"
            />
          </Show>

          {/* Navigation Arrows (only show if not comparing and multiple images) */}
          <Show when={!isComparing() && props.images.length > 1}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={2} stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={2} stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </Show>

          {/* Comparison Toggle Button */}
          <div class="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => setIsComparing(!isComparing())}
              class="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg backdrop-blur-sm transition-all font-medium text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={2} stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {isComparing() ? "Exit Compare" : "Compare with Before"}
            </button>
          </div>

          {/* Image Counter Badge */}
          <Show when={!isComparing()}>
            <div class="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
              {activeIndex() + 1} / {props.images.length}
            </div>
          </Show>
        </div>

        {/* Thumbnails */}
        <Show when={!isComparing() && props.images.length > 1}>
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <For each={props.images}>
              {(img, idx) => (
                <button
                  onClick={() => setActiveIndex(idx())}
                  class={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden transition-all ${
                    activeIndex() === idx()
                      ? "ring-2 ring-accent ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imageUrl(img)}
                    alt={`Thumbnail ${idx() + 1}`}
                    loading="lazy"
                    class="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
