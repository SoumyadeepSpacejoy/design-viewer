import { Show } from "solid-js";

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader(props: PageLoaderProps) {
  return (
    <div class="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div class="relative w-12 h-12 mb-5">
        {/* Outer ring */}
        <div class="absolute inset-0 rounded-full border border-border page-loader-ring-outer" />
        {/* Middle ring */}
        <div class="absolute inset-1.5 rounded-full border border-foreground/10 page-loader-ring-middle" />
        {/* Inner spinning arc */}
        <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground page-loader-spin" />
        {/* Center dot */}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-foreground page-loader-dot" />
        </div>
      </div>
      <Show when={props.message}>
        <p class="text-sm text-muted-foreground page-loader-text">{props.message}</p>
      </Show>
      {/* Shimmer bar */}
      <div class="w-32 h-0.5 bg-muted rounded-full overflow-hidden mt-4">
        <div class="h-full w-1/3 bg-foreground/20 rounded-full page-loader-bar" />
      </div>
    </div>
  );
}
