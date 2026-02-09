"use client";

import { useTheme } from "./ThemeContext";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (
    newTheme: "light" | "dark" | "system",
    e: React.MouseEvent,
  ) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty("--toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--toggle-y", `${y}px`);
    setTheme(newTheme);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 backdrop-blur-md rounded-full border border-border">
      <button
        onClick={(e) => handleThemeChange("light", e)}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-lg scale-110"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light Mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "system"
            ? "bg-primary text-primary-foreground shadow-lg scale-110"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System Default"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      </button>

      <button
        onClick={(e) => handleThemeChange("dark", e)}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-lg scale-110"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark Mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>
    </div>
  );
}
