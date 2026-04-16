"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { fetchDesigns } from "@/app/actions";
import { Design } from "@/app/types";
import Image from "next/image";
import Link from "next/link";

const IMAGE_BASE_URL = "https://ik.imagekit.io/spacejoy";

export default function DesignFeed() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView();

  const loadMoreDesigns = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const newDesigns = await fetchDesigns(skip);
      if (newDesigns.length === 0) {
        setHasMore(false);
      } else {
        setDesigns((prev) => {
          const existingIds = new Set(prev.map((d) => d._id));
          const uniqueNewDesigns = newDesigns.filter(
            (d) => !existingIds.has(d._id),
          );
          return [...prev, ...uniqueNewDesigns];
        });
        setSkip((prev) => prev + 10);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMoreDesigns();
    }
  }, [inView]);

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">AI Designs</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse AI-generated interior design concepts</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {designs.map((design) => {
          const firstImage = design.designImages[0];
          if (!firstImage) return null;

          const cleanCdnPath = firstImage.cdn.startsWith("/")
            ? firstImage.cdn.slice(1)
            : firstImage.cdn;
          const imageUrl = `${IMAGE_BASE_URL}/${cleanCdnPath}`;

          let displayTitle = design.title || `${design.roomType} Design`;
          if (
            typeof design.project === "object" &&
            design.project !== null &&
            "user" in design.project
          ) {
            const userName = design.project.user?.profile?.name;
            if (userName) {
              displayTitle = `${userName}'s ${design.roomType} Design`;
            }
          }

          return (
            <Link
              href={`/design/${design._id}`}
              key={design._id}
              className="card card-interactive group overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={displayTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3">
                  <span className="badge badge-primary text-xs backdrop-blur-sm bg-primary/80 text-white border-0">
                    {design.roomType}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {displayTitle}
                </h2>
                {design.intent.secondary && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">
                    {design.intent.secondary}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-12">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading designs...</span>
            </div>
          ) : (
            <div className="h-10" />
          )}
        </div>
      )}

      {!hasMore && designs.length > 0 && (
        <div className="text-center py-12 border-t border-border mt-6">
          <p className="text-sm text-muted-foreground">All designs loaded</p>
        </div>
      )}
    </div>
  );
}
