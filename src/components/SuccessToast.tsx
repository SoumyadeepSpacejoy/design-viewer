import { createSignal, onCleanup, onMount, Show } from "solid-js";

interface SuccessToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function SuccessToast(props: SuccessToastProps) {
  const [isVisible, setIsVisible] = createSignal(true);

  onMount(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (props.onClose) setTimeout(props.onClose, 300);
    }, props.duration ?? 4000);
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <Show when={isVisible()}>
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-up">
        <div class="card px-5 py-3 flex items-center gap-3 shadow-xl border-success/20">
          <div class="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
            <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span class="text-sm font-medium text-foreground">{props.message}</span>
        </div>
      </div>
    </Show>
  );
}
