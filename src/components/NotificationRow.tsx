import { createSignal, onCleanup, onMount, Show } from "solid-js";
import type { Notification } from "~/lib/types";

interface NotificationRowProps {
  notification: Notification;
  onEdit: (notification: Notification) => void;
  onDelete: (id: string) => void;
  onPush: (id: string) => void;
  onSchedule: (id: string) => void;
}

export default function NotificationRow(props: NotificationRowProps) {
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef && !menuRef.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  });

  return (
    <div class={`card p-4 sm:p-5 transition-all ${isMenuOpen() ? "z-50 ring-1 ring-primary/20" : "z-auto"}`}>
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="badge badge-primary">{props.notification.topic}</span>
            <span class="text-xs text-muted-foreground">
              {new Date(props.notification.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h4 class="text-sm font-semibold text-foreground mb-1 truncate">
            {props.notification.title}
          </h4>
          <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {props.notification.body}
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Type: {props.notification.type}
            </span>
            <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Route: {props.notification.route}
            </span>
          </div>
        </div>

        {/* Actions dropdown */}
        <div class="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen())}
            class={`btn btn-ghost btn-icon w-8 h-8 ${isMenuOpen() ? "bg-primary/10 text-primary" : ""}`}
            title="Actions"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          <Show when={isMenuOpen()}>
            <div class="absolute right-0 mt-2 w-48 card p-1.5 shadow-xl z-50 animate-fade-in">
              <button
                onClick={() => {
                  props.onPush(props.notification._id);
                  setIsMenuOpen(false);
                }}
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.05 9.05 0 0112.728 0" />
                </svg>
                Push Now
              </button>
              <button
                onClick={() => {
                  props.onSchedule(props.notification._id);
                  setIsMenuOpen(false);
                }}
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule
              </button>
              <button
                onClick={() => {
                  props.onEdit(props.notification);
                  setIsMenuOpen(false);
                }}
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <div class="h-px bg-border my-1 mx-2" />
              <button
                onClick={() => {
                  props.onDelete(props.notification._id);
                  setIsMenuOpen(false);
                }}
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
