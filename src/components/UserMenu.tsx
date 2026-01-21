"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
    <div
      className="fixed top-6 right-6 sm:top-8 sm:right-8 z-50"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group focus:outline-none"
      >
        {/* Initials Container with Glow */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-600 to-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300 transform group-hover:scale-105 active:scale-95">
          <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border border-pink-500/20">
            <span className="text-xl sm:text-2xl font-bold text-pink-100 tracking-tighter drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]">
              {initial}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-pink-500 rounded-full border-2 border-black shadow-[0_0_8px_#ec4899] animate-pulse"></div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-48 glass-panel rounded-2xl border border-pink-500/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2">
            <div className="px-4 py-3 mb-2 border-b border-pink-500/5">
              <p className="text-[10px] font-bold text-pink-500/40 uppercase tracking-widest">
                Logged In As
              </p>
              <p className="text-sm font-light text-pink-100 truncate">
                {userName}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pink-400/80 hover:text-pink-100 hover:bg-pink-500/10 rounded-xl transition-colors group"
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
              <span>Logout Portal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
