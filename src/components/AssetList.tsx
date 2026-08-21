import { For, Show } from "solid-js";
import type { Asset } from "~/lib/types";

const ASSET_BASE_URL =
  "https://res.cloudinary.com/spacejoy/image/upload/fl_lossy,q_auto,w_800"; // Added optimizations

interface AssetListProps {
  assets: Asset[];
}

function assetImageUrl(asset: Asset) {
  const firstImage = asset.productImages[0];
  if (!firstImage) return "/placeholder-asset.svg"; // Fallback

  const cleanCdnPath = firstImage.cdn.startsWith("/")
    ? firstImage.cdn.slice(1)
    : firstImage.cdn;
  return `${ASSET_BASE_URL}/${cleanCdnPath}`;
}

export default function AssetList(props: AssetListProps) {
  return (
    <Show when={props.assets && props.assets.length > 0}>
      <div class="space-y-6">
        <h3 class="text-2xl font-bold text-foreground">Shop the Look</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <For each={props.assets}>
            {(asset) => (
              <a
                href={asset.retailLink}
                target="_blank"
                rel="noopener noreferrer"
                class="group flex flex-col space-y-3 p-4 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card"
              >
                <div class="relative aspect-square overflow-hidden rounded-lg bg-gray-50 p-2">
                  <img
                    src={assetImageUrl(asset)}
                    alt={asset.name}
                    loading="lazy"
                    class="absolute inset-0 w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div class="flex-grow space-y-1">
                  <p class="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                    {asset.retailer?.name || "Unknown Retailer"}
                  </p>
                  <h4 class="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {asset.name}
                  </h4>
                </div>

                <div class="border-t border-border flex items-center justify-between">
                  <span class="text-sm font-bold text-foreground">
                    ${asset.price.toLocaleString()}
                  </span>
                  <Show when={asset.msrp > asset.price}>
                    <span class="text-xs text-muted-foreground/40 line-through">
                      ${asset.msrp.toLocaleString()}
                    </span>
                  </Show>
                </div>
              </a>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
