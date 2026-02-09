"use client";

import { Asset } from "@/app/types";
import Image from "next/image";

const ASSET_BASE_URL =
  "https://res.cloudinary.com/spacejoy/image/upload/fl_lossy,q_auto,w_800"; // Added optimizations

interface AssetListProps {
  assets: Asset[];
}

export default function AssetList({ assets }: AssetListProps) {
  if (!assets || assets.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-foreground">Shop the Look</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map((asset) => {
          const firstImage = asset.productImages[0];
          let imageUrl = "/placeholder-asset.svg"; // Fallback

          if (firstImage) {
            const cleanCdnPath = firstImage.cdn.startsWith("/")
              ? firstImage.cdn.slice(1)
              : firstImage.cdn;
            imageUrl = `${ASSET_BASE_URL}/${cleanCdnPath}`;
          }

          return (
            <a
              key={asset._id}
              href={asset.retailLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col space-y-3 p-4 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 p-2">
                <Image
                  src={imageUrl}
                  alt={asset.name}
                  fill
                  className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>

              <div className="flex-grow space-y-1">
                <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                  {asset.retailer?.name || "Unknown Retailer"}
                </p>
                <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {asset.name}
                </h4>
              </div>

              <div className="border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  ${asset.price.toLocaleString()}
                </span>
                {asset.msrp > asset.price && (
                  <span className="text-xs text-muted-foreground/40 line-through">
                    ${asset.msrp.toLocaleString()}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
