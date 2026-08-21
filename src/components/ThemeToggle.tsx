import { createSignal, onMount, Show } from "solid-js";
import { useTheme } from "./ThemeContext";

type ThemeName = "light" | "dark" | "system";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = createSignal(false);

  onMount(() => setMounted(true));

  const handleThemeChange = (newTheme: ThemeName, e: MouseEvent) => {
    document.documentElement.style.setProperty("--toggle-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--toggle-y", `${e.clientY}px`);
    setTheme(newTheme);
  };

  const buttonClass = (name: ThemeName) =>
    `p-2 rounded-full transition-all duration-300 ${
      theme() === name
        ? "bg-primary text-primary-foreground shadow-lg scale-110"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <Show when={mounted()}>
      <div class="flex items-center gap-1 p-1 bg-secondary/50 backdrop-blur-md rounded-full border border-border">
        <button
          onClick={(e) => handleThemeChange("light", e)}
          class={buttonClass("light")}
          title="Light Mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </button>

        <button
          onClick={(e) => handleThemeChange("system", e)}
          class={buttonClass("system")}
          title="System Default"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
        </button>

        <button
          onClick={(e) => handleThemeChange("dark", e)}
          class={buttonClass("dark")}
          title="Dark Mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>
      </div>
    </Show>
  );
}
