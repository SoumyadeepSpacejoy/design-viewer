"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Explorer");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Read user name from localStorage
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setUserName(storedName);
    }

    // Handle clicks outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    router.push("/login");
    // Trigger storage event for AuthGuard
    window.dispatchEvent(new Event("storage"));
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-4">
      <ThemeToggle />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group focus:outline-none"
        >
          {/* Initials Container with Glow */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary to-accent shadow-lg group-hover:shadow-primary/40 transition-all duration-300 transform group-hover:scale-105 active:scale-95">
            <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center border border-primary/20">
              <span className="text-lg sm:text-xl font-bold text-foreground tracking-tighter">
                {initial}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md animate-pulse"></div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-56 premium-card border-border shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="px-4 py-3 mb-2 border-b border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                Session Active
              </p>
              <p className="text-sm font-semibold text-foreground truncate mt-1">
                {userName}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 group"
            >
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">Logout Portal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
