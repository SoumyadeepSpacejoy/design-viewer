import { createEffect, createSignal, onCleanup } from "solid-js";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  alt: string;
}

export default function BeforeAfterSlider(props: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = createSignal(50);
  const [isDragging, setIsDragging] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const handleMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging() || !containerRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : (event as MouseEvent).clientX;

    const position = ((clientX - containerRect.left) / containerRect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handleMouseUp = () => setIsDragging(false);

  createEffect(() => {
    if (!isDragging()) return;

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);

    onCleanup(() => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    });
  });

  return (
    <div
      ref={containerRef}
      class="relative w-full aspect-[4/3] overflow-hidden rounded-xl select-none cursor-ew-resize"
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* After Image (Background) */}
      <img
        src={props.afterImage}
        alt={`After: ${props.alt}`}
        class="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before Image (Foreground - Clipped) */}
      <div
        class="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ "clip-path": `inset(0 ${100 - sliderPosition()}% 0 0)` }}
      >
        <img
          src={props.beforeImage}
          alt={`Before: ${props.alt}`}
          class="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Slider Handle */}
      <div
        class="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition()}%` }}
      >
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width={2}
            stroke="currentColor"
            class="w-4 h-4 text-gray-600"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 9L12 5.25 8.25 9M8.25 15L12 18.75 15.75 15"
              class="rotate-90 origin-center"
            />
          </svg>
          <div class="flex gap-1">
            <div class="border-l-2 border-gray-400 h-3" />
            <div class="border-l-2 border-gray-400 h-3" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div class="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
        Before
      </div>
      <div class="absolute top-4 right-4 bg-accent/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
        After
      </div>
    </div>
  );
}
