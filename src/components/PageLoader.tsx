"use client";

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-12 h-12 mb-5">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-border page-loader-ring-outer" />
        {/* Middle ring */}
        <div className="absolute inset-1.5 rounded-full border border-foreground/10 page-loader-ring-middle" />
        {/* Inner spinning arc */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground page-loader-spin" />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground page-loader-dot" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground page-loader-text">{message}</p>
      )}
      {/* Shimmer bar */}
      <div className="w-32 h-0.5 bg-muted rounded-full overflow-hidden mt-4">
        <div className="h-full w-1/3 bg-foreground/20 rounded-full page-loader-bar" />
      </div>
    </div>
  );
}
