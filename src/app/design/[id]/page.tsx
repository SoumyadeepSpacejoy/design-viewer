import { fetchDesignDetails } from "@/app/actions";
import DesignImageSlider from "@/components/DesignImageSlider";
import AssetList from "@/components/AssetList";
import { notFound } from "next/navigation";
import Link from "next/link";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DesignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const design = await fetchDesignDetails(id);

  if (!design) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link
            href="/designs"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Designs
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-3 sm:p-4">
              <DesignImageSlider
                images={design.designImages}
                beforeImage={design.beforeImage}
              />
            </div>

            <div className="hidden lg:block">
              <AssetList assets={design.assets} />
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
                  {design.intent.primary}
                </h1>
                {design.intent.secondary && (
                  <p className="text-muted-foreground text-sm">{design.intent.secondary}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary">{design.roomType}</span>
                {design.style && (
                  <span className="badge" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{design.style}</span>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Details</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Project ID</dt>
                    <dd className="font-mono text-foreground text-xs">{design.project?.slice(0, 8)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Created</dt>
                    <dd className="text-foreground text-xs">{new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="lg:hidden col-span-1">
            <AssetList assets={design.assets} />
          </div>
        </div>
      </main>
    </div>
  );
}
