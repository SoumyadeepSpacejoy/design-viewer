import { A, createAsync, query, useParams } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import AssetList from "~/components/AssetList";
import DesignImageSlider from "~/components/DesignImageSlider";
import PageLoader from "~/components/PageLoader";
import { fetchDesignDetails } from "~/lib/designApi";

const getDesign = query(
  (id: string) => fetchDesignDetails(id),
  "design-detail",
);

export const route = {
  preload: ({ params }: { params: Record<string, string> }) =>
    getDesign(params.id),
};

export default function DesignDetailPage() {
  const params = useParams<{ id: string }>();
  const design = createAsync(() => getDesign(params.id));

  return (
    <div class="min-h-screen bg-background pb-20">
      {/* Navigation */}
      <nav class="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <A
            href="/designs"
            class="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Designs
          </A>
        </div>
      </nav>

      <Suspense fallback={<PageLoader message="Loading design..." />}>
        <Show
          when={design()}
          fallback={
            <div class="max-w-7xl mx-auto px-4 py-24 text-center">
              <h1 class="text-xl font-semibold text-foreground mb-2">
                Design not found
              </h1>
              <p class="text-sm text-muted-foreground">
                This design may have been removed.
              </p>
            </div>
          }
        >
          {(d) => (
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Images */}
                <div class="lg:col-span-2 space-y-6">
                  <div class="card p-3 sm:p-4">
                    <DesignImageSlider
                      images={d().designImages}
                      beforeImage={d().beforeImage}
                    />
                  </div>

                  <div class="hidden lg:block">
                    <AssetList assets={d().assets} />
                  </div>
                </div>

                {/* Right Column: Details */}
                <div class="lg:col-span-1">
                  <div class="card p-6 sticky top-20 space-y-6">
                    <div>
                      <h1 class="text-2xl font-semibold text-foreground mb-2 tracking-tight">
                        {d().intent.primary}
                      </h1>
                      <Show when={d().intent.secondary}>
                        <p class="text-muted-foreground text-sm">
                          {d().intent.secondary}
                        </p>
                      </Show>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <span class="badge badge-primary">{d().roomType}</span>
                      <Show when={d().style}>
                        <span
                          class="badge"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {d().style}
                        </span>
                      </Show>
                    </div>

                    <div class="pt-4 border-t border-border">
                      <h3 class="text-xs font-medium text-muted-foreground mb-3">
                        Details
                      </h3>
                      <dl class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt class="text-xs text-muted-foreground mb-0.5">
                            Project ID
                          </dt>
                          <dd class="font-mono text-foreground text-xs">
                            {d().project?.slice(0, 8)}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-xs text-muted-foreground mb-0.5">
                            Created
                          </dt>
                          <dd class="text-foreground text-xs">
                            {new Date().toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                <div class="lg:hidden col-span-1">
                  <AssetList assets={d().assets} />
                </div>
              </div>
            </main>
          )}
        </Show>
      </Suspense>
    </div>
  );
}
