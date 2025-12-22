"use client";

import { useState } from "react";
import Image from "next/image";
import { DesignImage } from "@/app/types";
import BeforeAfterSlider from "./BeforeAfterSlider";

const IMAGE_BASE_URL = "https://ik.imagekit.io/spacejoy";

interface DesignImageSliderProps {
  images: DesignImage[];
  beforeImage: string;
}

export default function DesignImageSlider({
  images,
  beforeImage,
}: DesignImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComparing, setIsComparing] = useState(false);

  const activeImage = images[activeIndex];
  const cleanCdnPath = activeImage?.cdn.startsWith("/")
    ? activeImage.cdn.slice(1)
    : activeImage.cdn;
  const activeImageUrl = activeImage ? `${IMAGE_BASE_URL}/${cleanCdnPath}` : "";

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
    setIsComparing(false); // Reset comparison mode when changing image
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsComparing(false);
  };

  if (!activeImage) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-card-border">
        {isComparing ? (
          <BeforeAfterSlider
            beforeImage={beforeImage}
            afterImage={activeImageUrl}
            alt="Room Design"
          />
        ) : (
          <Image
            src={activeImageUrl}
            alt={`Design view ${activeIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Navigation Arrows (only show if not comparing and multiple images) */}
        {!isComparing && images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </>
        )}

        {/* Comparison Toggle Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setIsComparing(!isComparing)}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg backdrop-blur-sm transition-all font-medium text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
            {isComparing ? "Exit Compare" : "Compare with Before"}
          </button>
        </div>

        {/* Image Counter Badge */}
        {!isComparing && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {!isComparing && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => {
            const thumbCleanPath = img.cdn.startsWith("/")
              ? img.cdn.slice(1)
              : img.cdn;
            const thumbUrl = `${IMAGE_BASE_URL}/${thumbCleanPath}`;
            return (
              <button
                key={img._id}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden transition-all ${
                  activeIndex === idx
                    ? "ring-2 ring-accent ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
