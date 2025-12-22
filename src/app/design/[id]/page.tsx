import { fetchDesignDetails } from "@/app/actions";
import DesignImageSlider from "@/components/DesignImageSlider";
import AssetList from "@/components/AssetList";
import { notFound } from "next/navigation";
import Link from "next/link";

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
      <nav className="bg-white border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center text-gray-500 hover:text-accent transition-colors group"
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50">
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 sticky top-24 space-y-6">
              <div>
                <h1 className="text-3xl font-light text-gray-900 mb-2">
                  {design.intent.primary}
                </h1>
                {design.intent.secondary && (
                  <p className="text-gray-500 text-lg font-light">
                    {design.intent.secondary}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-pink-50 text-accent text-sm font-medium rounded-full uppercase tracking-wider">
                  {design.roomType}
                </span>
                {design.style && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full uppercase tracking-wider">
                    {design.style}
                  </span>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Design Summary
                </h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Project ID</dt>
                    <dd className="font-mono text-gray-700">
                      {design.project?.slice(0, 8)}...
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Created</dt>
                    <dd className="text-gray-700">
                      {new Date().toLocaleDateString()}
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
