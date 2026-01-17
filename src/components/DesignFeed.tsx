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
      console.error("Failed to load designs:", error);
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {designs.map((design, index) => {
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
              className={`group glass-panel rounded-3xl overflow-hidden hover:border-pink-500/40 transition-all duration-500 flex flex-col border border-pink-500/10 animate-fade-in-scale opacity-0 stagger-${(index % 6) + 1}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                <Image
                  src={imageUrl}
                  alt={displayTitle}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out opacity-80 group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                {/* Float tag on image */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-pink-300 uppercase bg-black/60 backdrop-blur-md rounded-lg border border-pink-500/20">
                    {design.roomType}
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow bg-transparent">
                <h2 className="text-xl font-light text-pink-100 line-clamp-2 mb-4 group-hover:text-pink-400 transition-colors tracking-tight leading-snug">
                  {displayTitle}
                </h2>
                {design.intent.secondary && (
                  <p className="text-xs text-pink-300/40 line-clamp-2 mt-auto uppercase tracking-widest font-medium leading-relaxed">
                    {design.intent.secondary}
                  </p>
                )}

                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-pink-500/60 uppercase tracking-[0.2em] group-hover:text-pink-400 transition-colors">
                  View Architecture
                  <svg
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
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
        <div ref={ref} className="flex justify-center py-24">
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce shadow-[0_0_8px_#ec4899] [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce shadow-[0_0_8px_#ec4899] [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce shadow-[0_0_8px_#ec4899]"></div>
            </div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center text-pink-500/20 py-20 text-[10px] uppercase tracking-[0.4em] font-bold">
          — NEURAL FEED TERMINATED —
        </div>
      )}
    </div>
  );
}
