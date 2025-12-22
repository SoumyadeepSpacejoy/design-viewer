import DesignFeed from "@/components/DesignFeed";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-white border-b border-pink-100 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 opacity-40"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          {/* Floral and Home Icons */}
          <div className="flex justify-center items-center gap-8 mb-8">
            {/* Left Flower */}
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400 animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C10.9 2 10 2.9 10 4C10 4.6 10.2 5.1 10.6 5.5C9.7 5.8 9 6.6 9 7.5C9 8.3 9.5 9 10.2 9.4C9.5 9.8 9 10.5 9 11.3C9 12.4 9.9 13.3 11 13.3C11.3 13.3 11.6 13.2 11.9 13.1L12 22H12C12 22 12.1 13.1 12.1 13.1C12.4 13.2 12.7 13.3 13 13.3C14.1 13.3 15 12.4 15 11.3C15 10.5 14.5 9.8 13.8 9.4C14.5 9 15 8.3 15 7.5C15 6.6 14.3 5.8 13.4 5.5C13.8 5.1 14 4.6 14 4C14 2.9 13.1 2 12 2Z" />
            </svg>

            {/* Home Icon */}
            <div className="relative">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-accent drop-shadow-lg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
            </div>

            {/* Right Flower */}
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 animate-pulse"
              style={{ animationDelay: "0.5s" }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C10.9 2 10 2.9 10 4C10 4.6 10.2 5.1 10.6 5.5C9.7 5.8 9 6.6 9 7.5C9 8.3 9.5 9 10.2 9.4C9.5 9.8 9 10.5 9 11.3C9 12.4 9.9 13.3 11 13.3C11.3 13.3 11.6 13.2 11.9 13.1L12 22H12C12 22 12.1 13.1 12.1 13.1C12.4 13.2 12.7 13.3 13 13.3C14.1 13.3 15 12.4 15 11.3C15 10.5 14.5 9.8 13.8 9.4C14.5 9 15 8.3 15 7.5C15 6.6 14.3 5.8 13.4 5.5C13.8 5.1 14 4.6 14 4C14 2.9 13.1 2 12 2Z" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-4">
            Spacejoy <span className="text-accent font-normal">Ai-Designs</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 font-light">
            Curated AI-generated designs to transform your space into something
            extraordinary.
          </p>

          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-pink-300"></div>
            <svg
              className="w-4 h-4 text-pink-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-pink-300"></div>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <DesignFeed />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm font-light">
        <p>© {new Date().getFullYear()} Spacejoy AI Design Viewer</p>
      </footer>
    </div>
  );
}
