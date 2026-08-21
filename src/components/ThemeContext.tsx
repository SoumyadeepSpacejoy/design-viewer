import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from "solid-js";
import { isServer } from "solid-js/web";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setThemeState] = createSignal<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = createSignal<"light" | "dark">("dark");

  onMount(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) setThemeState(savedTheme);
  });

  createEffect(() => {
    if (isServer) return;

    const current = theme();
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      const next =
        current === "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : current;

      root.classList.remove("light", "dark");
      root.classList.add(next);
      setResolvedTheme(next);
    };

    updateTheme();
    localStorage.setItem("theme", current);

    if (current === "system") {
      mediaQuery.addEventListener("change", updateTheme);
      onCleanup(() => mediaQuery.removeEventListener("change", updateTheme));
    }
  });

  const setTheme = (newTheme: Theme) => {
    if (isServer || !(document as any).startViewTransition) {
      setThemeState(newTheme);
      return;
    }

    (document as any).startViewTransition(() => {
      setThemeState(newTheme);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
