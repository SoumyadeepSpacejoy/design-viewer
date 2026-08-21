import { type JSX } from "solid-js";
import Sidebar from "~/components/Sidebar";
import { SidebarProvider, useSidebar } from "~/components/SidebarContext";

function DashboardContent(props: { children: JSX.Element }) {
  const { collapsed } = useSidebar();

  return (
    <div class="min-h-screen bg-background">
      <Sidebar />
      <main class="pt-14 lg:pt-0 min-h-screen transition-all duration-300 ease-in-out">
        <div
          class="hidden lg:block transition-all duration-300 ease-in-out"
          style={{ "margin-left": `${collapsed() ? 72 : 260}px` }}
        >
          <div class="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto min-h-screen">
            {props.children}
          </div>
        </div>
        <div class="lg:hidden">
          <div class="p-4 sm:p-6 min-h-screen">{props.children}</div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout(props: { children: JSX.Element }) {
  return (
    <SidebarProvider>
      <DashboardContent>{props.children}</DashboardContent>
    </SidebarProvider>
  );
}
