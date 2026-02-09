"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authCheck = () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        if (pathname !== "/login") {
          setAuthorized(false);
          router.push("/login");
        } else {
          setAuthorized(true);
        }
      } else {
        if (pathname === "/login") {
          setAuthorized(false);
          router.push("/");
        } else {
          setAuthorized(true);
        }
      }
      setLoading(false);
    };

    authCheck();

    // Optional: listen for storage changes to handle multi-tab logout
    window.addEventListener("storage", authCheck);
    return () => window.removeEventListener("storage", authCheck);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-700">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_15px_var(--primary)]"></div>
      </div>
    );
  }

  // If we're not authorized for the current route, show nothing while we redirect
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
