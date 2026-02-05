"use client";

import React, { useState, useRef } from "react";

export default function RenderService() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setError(null);
    }
  };

  const handleRender = async () => {
    if (!selectedFile) return;

    setIsRendering(true);
    setError(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(
        "https://ai-experiment.spacejoy.com/v1/render",
        {
          method: "POST",
          headers: {
            key: "09f498fa-fcda-496e-97a1-db438b5d79a6",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Rendering failed. Please try again.");
      }

      const data = await response.json();
      if (data.url) {
        setResultUrl(data.url);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during rendering.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rendered-design.png";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Fallback to opening in new tab if blob download fails
      window.open(resultUrl, "_blank");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="text-center mb-12 animate-fade-in">
        <h2 className="text-3xl sm:text-5xl font-thin text-pink-100 tracking-tight mb-4 uppercase">
          Neural <span className="text-pink-400 font-light italic">Render</span>
        </h2>
        <p className="text-pink-300/40 font-light uppercase text-xs tracking-[0.3em]">
          Transform concepts into cinematic reality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Sidebar (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-[2rem] border border-pink-500/10 flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative">
              <label className="text-[10px] font-bold text-pink-500/60 uppercase tracking-widest mb-4 block">
                Control Panel / Input
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative ${
                  selectedFile
                    ? "border-pink-500/40"
                    : "border-pink-500/10 hover:border-pink-500/30"
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain bg-black/40 animate-fade-in"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-pink-500/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-pink-500/10 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-pink-500/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-pink-400/30 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                      Select Architecture Concept
                      <br />
                      (Image File)
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <button
              onClick={handleRender}
              disabled={!selectedFile || isRendering}
              className={`relative group h-14 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-500 overflow-hidden ${
                selectedFile && !isRendering
                  ? "bg-pink-500 text-black hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] active:scale-95"
                  : "bg-white/5 text-pink-500/20 cursor-not-allowed"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isRendering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Neural Render
                  </>
                )}
              </span>
            </button>

            {error && (
              <p className="text-red-400 text-[9px] font-bold uppercase tracking-tight text-center">
                {error}
              </p>
            )}
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border border-pink-500/5 hidden lg:block">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-pink-500/40 mb-4">
              Neural Engine Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                <span className="text-pink-100/40">Latent Space</span>
                <span className="text-green-500/60">Optimized</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-pink-500/40 rounded-full animate-pulse"></div>
              </div>
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                <span className="text-pink-100/40">Gpu Compute</span>
                <span className="text-pink-400">4.2 Tflops</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Hero (8 columns) */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-6 sm:p-10 rounded-[3rem] border border-pink-500/10 flex flex-col gap-6 relative overflow-hidden group h-full transition-all duration-700 hover:border-pink-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative h-full flex flex-col min-h-[500px] lg:min-h-[700px]">
              <div className="flex justify-between items-center mb-6">
                <label className="text-xs font-bold text-pink-500/60 uppercase tracking-[0.3em] block">
                  Architectural Synthesis{" "}
                  <span className="text-pink-500/20 ml-2">v4.0</span>
                </label>
                {resultUrl && !isRendering && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-green-500/80 uppercase tracking-widest">
                      Render Ready
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 rounded-[2.5rem] bg-black/60 border border-pink-500/5 relative overflow-hidden flex items-center justify-center p-4">
                {isRendering ? (
                  <div className="text-center relative">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                      <div className="absolute inset-0 border-4 border-pink-500/10 rounded-full scale-125"></div>
                      <div className="absolute inset-0 border-4 border-t-pink-500 rounded-full animate-spin shadow-[0_0_40px_rgba(236,72,153,0.5)]"></div>
                      <div className="absolute inset-4 border-2 border-pink-500/20 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                      <div className="absolute inset-8 border-2 border-pink-500/10 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-pink-500/5 rounded-full blur-[60px] animate-pulse"></div>
                    </div>
                    <p className="text-pink-400 font-bold uppercase tracking-[0.6em] text-[10px] animate-pulse">
                      Synthesizing Reality
                    </p>
                  </div>
                ) : resultUrl ? (
                  <div className="w-full h-full relative group/result">
                    <img
                      src={resultUrl}
                      alt="Rendered Result"
                      className="w-full h-full object-contain animate-fade-in transition-all duration-1000 group-hover/result:scale-[1.01]"
                    />

                    {/* Floating Download Action */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover/result:opacity-100 transition-all duration-500 translate-y-4 group-hover/result:translate-y-0">
                      <button
                        onClick={handleDownload}
                        className="bg-pink-500 text-black px-7 py-4 rounded-2xl shadow-[0_15px_50px_rgba(236,72,153,0.5)] hover:bg-pink-400 transition-all active:scale-95 flex items-center gap-3 backdrop-blur-md"
                      >
                        <svg
                          className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span className="text-[11px] font-black uppercase tracking-widest">
                          Download Asset
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 relative">
                    <div className="w-24 h-24 bg-pink-500/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-pink-500/10 relative overflow-hidden group/empty">
                      <div className="absolute inset-0 bg-pink-500/10 translate-y-full group-hover/empty:translate-y-0 transition-transform duration-700"></div>
                      <svg
                        className="w-10 h-10 text-pink-500/40 relative z-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <p className="text-pink-400/40 text-[11px] font-bold uppercase tracking-[0.4em] leading-[2.5] max-w-sm mx-auto">
                      Architectural outputs materialize
                      <br />
                      <span className="text-pink-400/20">
                        within this neural viewport
                      </span>
                      <br />
                      upon initiation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
