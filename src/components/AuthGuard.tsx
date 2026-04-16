"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoader from "./PageLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authCheck = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
    window.addEventListener("storage", authCheck);
    return () => window.removeEventListener("storage", authCheck);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
