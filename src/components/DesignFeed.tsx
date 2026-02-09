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
    <div className="container mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
              className="premium-card flex flex-col group animate-fade-in-scale"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={displayTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground uppercase bg-primary backdrop-blur-md rounded-full shadow-lg">
                    {design.roomType}
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <h2 className="text-xl font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors tracking-tight">
                  {displayTitle}
                </h2>
                {design.intent.secondary && (
                  <p className="text-xs text-foreground/50 line-clamp-2 mt-auto uppercase tracking-wider font-bold">
                    {design.intent.secondary}
                  </p>
                )}

                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300">
                  Precision View
                  <svg
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div
          ref={ref}
          className="flex flex-col items-center justify-center py-24"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground/50">
                Loading Assets
              </p>
            </div>
          ) : (
            <div className="h-20"></div>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center text-muted-foreground py-24 border-t border-border/10 mt-12">
          <p className="text-[10px] uppercase font-bold tracking-[0.5em] opacity-30">
            End of Intelligence Feed
          </p>
        </div>
      )}
    </div>
  );
}
