"use client";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className="pt-14 lg:pt-0 min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: undefined }}
      >
        <div
          className="hidden lg:block transition-all duration-300 ease-in-out"
          style={{ marginLeft: collapsed ? 72 : 260 }}
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto min-h-screen">
            {children}
          </div>
        </div>
        <div className="lg:hidden">
          <div className="p-4 sm:p-6 min-h-screen">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
