import { createSignal, Show } from "solid-js";

export default function RenderService() {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [isRendering, setIsRendering] = createSignal(false);
  const [resultUrl, setResultUrl] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [isDragging, setIsDragging] = createSignal(false);
  const [showCompare, setShowCompare] = createSignal(false);
  const [sliderPos, setSliderPos] = createSignal(50);
  let fileInputRef: HTMLInputElement | undefined;
  let compareRef: HTMLDivElement | undefined;
  let draggingSlider = false;

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setShowCompare(false);
    setError(null);
  };

  const handleFileChange = (e: Event & { currentTarget: HTMLInputElement }) => {
    const file = e.currentTarget.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  };

  const handleRender = async () => {
    const file = selectedFile();
    if (!file) return;
    setIsRendering(true);
    setError(null);
    setResultUrl(null);
    setShowCompare(false);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("https://ai-experiment.spacejoy.com/v1/render", {
        method: "POST",
        headers: { key: "09f498fa-fcda-496e-97a1-db438b5d79a6" },
        body: formData,
      });
      if (!response.ok) throw new Error("Rendering failed. Please try again.");
      const data = await response.json();
      if (data.url) {
        setResultUrl(data.url);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during rendering.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = async () => {
    const target = resultUrl();
    if (!target) return;
    try {
      const response = await fetch(target);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rendered-design.png";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(target, "_blank");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setShowCompare(false);
    if (fileInputRef) fileInputRef.value = "";
  };

  const handleSliderMove = (clientX: number) => {
    if (!compareRef) return;
    const rect = compareRef.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleMouseDown = () => {
    draggingSlider = true;
  };
  const handleMouseUp = () => {
    draggingSlider = false;
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (draggingSlider) handleSliderMove(e.clientX);
  };
  const handleTouchMove = (e: TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  };

  return (
    <div class="animate-fade-in">
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-foreground tracking-tight">Render</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Upload an image to generate a photorealistic render
          </p>
        </div>
        <Show when={selectedFile() || resultUrl()}>
          <button onClick={handleReset} class="btn btn-ghost btn-sm gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
            Reset
          </button>
        </Show>
      </div>

      {/* ── State 1: Upload zone (no file selected) ── */}
      <Show when={!selectedFile()}>
        <div
          onClick={() => fileInputRef?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          class={`card cursor-pointer transition-all duration-200 ${
            isDragging() ? "border-foreground/30 bg-secondary" : "hover:border-foreground/20"
          }`}
        >
          <div class="flex flex-col items-center justify-center py-20 px-6">
            <div class="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <p class="text-sm font-medium text-foreground mb-1">
              {isDragging() ? "Drop your image here" : "Click to upload or drag and drop"}
            </p>
            <p class="text-xs text-muted-foreground">JPG, PNG or WebP</p>
          </div>
        </div>
      </Show>

      {/* ── State 2: File selected, ready to render or rendering ── */}
      <Show when={selectedFile() && !resultUrl()}>
        <div class="card overflow-hidden">
          {/* Preview */}
          <div
            class="bg-muted/30 flex items-center justify-center p-4 relative"
            style={{ "min-height": "400px" }}
          >
            {/* Always show preview when file is selected */}
            <img
              src={previewUrl()!}
              alt="Preview"
              class={`max-h-[400px] object-contain rounded-lg transition-all duration-500 ${
                isRendering() ? "scale-[0.97] blur-[2px] brightness-50" : "animate-fade-in"
              }`}
            />

            {/* Rendering overlay animation */}
            <Show when={isRendering()}>
              <div class="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
                {/* Scan line */}
                <div class="absolute inset-x-0 top-0 h-full overflow-hidden rounded-lg pointer-events-none">
                  <div class="render-scanline absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />
                </div>

                {/* Pulsing rings */}
                <div class="relative w-20 h-20 mb-5">
                  <div class="absolute inset-0 rounded-full border border-white/10 render-ring-1" />
                  <div class="absolute inset-1 rounded-full border border-white/15 render-ring-2" />
                  <div class="absolute inset-3 rounded-full border border-white/20 render-ring-3" />
                  {/* Center icon */}
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" class="text-white render-icon-pulse">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                <p class="text-sm font-medium text-white">Rendering...</p>
                {/* Progress dots */}
                <div class="flex gap-1.5 mt-3">
                  <div class="w-1.5 h-1.5 rounded-full bg-white/60 render-dot-1" />
                  <div class="w-1.5 h-1.5 rounded-full bg-white/60 render-dot-2" />
                  <div class="w-1.5 h-1.5 rounded-full bg-white/60 render-dot-3" />
                </div>
              </div>
            </Show>
          </div>

          {/* Actions bar */}
          <div class="border-t border-border px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {selectedFile()?.name}
                </p>
                <p class="text-xs text-muted-foreground">
                  {((selectedFile()?.size ?? 0) / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onClick={() => fileInputRef?.click()} class="btn btn-ghost btn-sm">
                Change
              </button>
              <button onClick={handleRender} disabled={isRendering()} class="btn btn-primary btn-sm gap-2">
                <Show
                  when={isRendering()}
                  fallback={
                    <>
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Render
                    </>
                  }
                >
                  <div class="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Rendering...
                </Show>
              </button>
            </div>
          </div>

          <Show when={error()}>
            <div class="border-t border-destructive/20 bg-destructive/5 px-5 py-3">
              <p class="text-sm text-destructive">{error()}</p>
            </div>
          </Show>
        </div>
      </Show>

      {/* ── State 3: Result ready ── */}
      <Show when={resultUrl()}>
        {(result) => (
          <div class="space-y-4 animate-fade-in">
            {/* Image display */}
            <div class="card overflow-hidden">
              <Show
                when={showCompare() && previewUrl()}
                fallback={
                  /* Rendered result */
                  <div
                    class="flex items-center justify-center p-4 bg-muted/20"
                    style={{ "min-height": "400px" }}
                  >
                    <img
                      src={result()}
                      alt="Rendered"
                      class="max-h-[500px] object-contain rounded-lg"
                    />
                  </div>
                }
              >
                {/* Before / After slider */}
                <div
                  ref={compareRef}
                  class="relative select-none cursor-col-resize"
                  style={{ "min-height": "400px" }}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseUp}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                >
                  {/* After (rendered) — full background */}
                  <img
                    src={result()}
                    alt="Rendered"
                    class="w-full object-contain"
                    style={{ "min-height": "400px" }}
                  />

                  {/* Before (original) — clipped */}
                  <div
                    class="absolute inset-0 overflow-hidden"
                    style={{ "clip-path": `inset(0 ${100 - sliderPos()}% 0 0)` }}
                  >
                    <img
                      src={previewUrl()!}
                      alt="Original"
                      class="w-full object-contain"
                      style={{ "min-height": "400px" }}
                    />
                  </div>

                  {/* Slider handle */}
                  <div class="absolute top-0 bottom-0" style={{ left: `${sliderPos()}%` }}>
                    <div class="absolute top-0 bottom-0 w-px bg-white/70 -translate-x-1/2" />
                    <div class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m8 6-6 6 6 6" /><path d="m16 6 6 6-6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Labels */}
                  <div class="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                    Before
                  </div>
                  <div class="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                    After
                  </div>
                </div>
              </Show>
            </div>

            {/* Action bar */}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Show when={previewUrl()}>
                  <button
                    onClick={() => {
                      setShowCompare(!showCompare());
                      setSliderPos(50);
                    }}
                    class={`btn btn-sm gap-2 ${showCompare() ? "btn-primary" : "btn-secondary"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <line x1="12" x2="12" y1="3" y2="21" />
                    </svg>
                    {showCompare() ? "Hide Compare" : "Before / After"}
                  </button>
                </Show>
                <button onClick={() => fileInputRef?.click()} class="btn btn-ghost btn-sm">
                  Upload New
                </button>
              </div>

              <button onClick={handleDownload} class="btn btn-primary btn-sm gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        )}
      </Show>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        class="hidden"
      />
    </div>
  );
}
