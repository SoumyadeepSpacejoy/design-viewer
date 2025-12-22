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
        setDesigns((prev) => [...prev, ...newDesigns]);
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
              className="group bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                <Image
                  src={imageUrl}
                  alt={displayTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-6 flex flex-col flex-grow bg-white">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase bg-pink-50 rounded-full">
                    {design.roomType}
                  </span>
                </div>
                <h2 className="text-xl font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-accent transition-colors">
                  {displayTitle}
                </h2>
                {design.intent.secondary && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-auto">
                    {design.intent.secondary}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-16">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="text-center text-gray-400 py-12 text-xs uppercase tracking-[0.2em] font-medium">
          — End of Collection —
        </div>
      )}
    </div>
  );
}
