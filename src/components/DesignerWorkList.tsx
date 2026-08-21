import { useNavigate } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import { fetchDesignersList } from "~/lib/clientApi";
import PageLoader from "./PageLoader";

export default function DesignerWorkList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = createSignal("");

  const [designers] = createResource(async () => {
    try {
      return await fetchDesignersList();
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  const filtered = () =>
    (designers() ?? []).filter((d) => {
      if (!searchText()) return true;
      const q = searchText().toLowerCase();
      return (
        d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q)
      );
    });

  return (
    <Show
      when={!designers.loading}
      fallback={<PageLoader message="Loading designers..." />}
    >
      <div class="animate-fade-in">
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-foreground tracking-tight">
            Designer Work
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Pick a designer to view their projects and time-filtered earnings.
          </p>
        </div>

        <div class="mb-4 relative max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="input h-9 text-sm"
            style={{ "padding-left": "2.5rem" }}
            placeholder="Search by name or email..."
            value={searchText()}
            onInput={(e) => setSearchText(e.currentTarget.value)}
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-items">
          <For each={filtered()}>
            {(designer) => (
              <button
                onClick={() => navigate(`/designer-work/${designer._id}`)}
                class="card card-interactive p-4 text-left flex items-center gap-3 group"
              >
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {designer.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {designer.name || "Unnamed"}
                  </p>
                  <p class="text-xs text-muted-foreground truncate">{designer.email}</p>
                  <p class="text-[11px] text-muted-foreground mt-1">
                    {designer.trackerCount}{" "}
                    {designer.trackerCount === 1 ? "project" : "projects"}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </For>
        </div>

        <Show when={filtered().length === 0}>
          <div class="card p-12 text-center">
            <p class="text-sm text-muted-foreground">No designers found.</p>
          </div>
        </Show>
      </div>
    </Show>
  );
}
