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
      <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span className="font-medium">Back to Feed</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Images */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-4 rounded-3xl shadow-2xl border border-border">
              <DesignImageSlider
                images={design.designImages}
                beforeImage={design.beforeImage}
              />
            </div>

            {/* Assets List for Desktop (below images) */}
            <div className="hidden lg:block">
              <AssetList assets={design.assets} />
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-border sticky top-24 space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                  {design.intent.primary}
                </h1>
                {design.intent.secondary && (
                  <p className="text-gray-500 text-lg font-light">
                    {design.intent.secondary}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest border border-primary/20">
                  {design.roomType}
                </span>
                {design.style && (
                  <span className="px-4 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-full uppercase tracking-widest border border-border">
                    {design.style}
                  </span>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-5">
                  Design Summary
                </h3>
                <dl className="grid grid-cols-2 gap-6 text-[11px] font-bold">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground uppercase tracking-widest">
                      Project ID
                    </dt>
                    <dd className="font-mono text-foreground">
                      {design.project?.slice(0, 8)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground uppercase tracking-widest">
                      CreatedAt
                    </dt>
                    <dd className="text-foreground">
                      {new Date().toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Assets List for Mobile (at bottom) */}
          <div className="lg:hidden col-span-1">
            <AssetList assets={design.assets} />
          </div>
        </div>
      </main>
    </div>
  );
}
