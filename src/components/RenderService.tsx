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
      window.open(resultUrl, "_blank");
    }
  };

  return (
    <div className="container mx-auto">
      <div className="text-center mb-16 sm:mb-24">
        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight mb-6 text-foreground">
          Neural{" "}
          <span className="text-primary font-bold italic">Architect</span>
        </h2>
        <p className="text-muted-foreground font-medium max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Proprietary rendering engine that synthesizes high-fidelity
          architectural visualizations from conceptual sketches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Input Sidebar (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="premium-card p-8 flex flex-col gap-8 relative overflow-hidden group h-full">
            <div>
              <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.2em] mb-6 block">
                Source Projection
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden relative shadow-inner ${
                  selectedFile
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-primary/30 bg-muted/20"
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain p-2 animate-fade-in"
                  />
                ) : (
                  <div className="text-center p-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 group-hover:scale-110 transition-all duration-500">
                      <svg
                        className="w-7 h-7 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                      Initialize Input Map
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
              className={`relative h-16 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] transition-all duration-500 overflow-hidden ${
                selectedFile && !isRendering
                  ? "bg-primary text-primary-foreground hover:shadow-2xl hover:shadow-primary/40 active:scale-95 shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isRendering ? (
                  <>
                    <div className="w-5 h-5 border-3 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Execute Render
                  </>
                )}
              </span>
            </button>

            {error && (
              <p className="text-destructive text-[10px] font-bold uppercase tracking-tight text-center bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                {error}
              </p>
            )}

            <div className="mt-auto border-t border-border/50 pt-8">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">
                Engine Diagnostics
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                  <span className="text-muted-foreground">
                    Latent Optimization
                  </span>
                  <span className="text-primary">85% Pure</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div className="w-[85%] h-full bg-primary rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                  <span className="text-muted-foreground">Compute Power</span>
                  <span className="text-foreground">4.2 Tflops</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Hero (8 columns) */}
        <div className="lg:col-span-8">
          <div className="premium-card p-8 sm:p-12 flex flex-col gap-8 relative overflow-hidden group h-full">
            <div className="flex flex-col h-full min-h-[500px] lg:min-h-[700px]">
              <div className="flex justify-between items-center mb-8">
                <label className="text-xs font-bold text-foreground/50 uppercase tracking-[0.3em] block">
                  Neural Output{" "}
                  <span className="text-primary/40 ml-2">v4.0.2</span>
                </label>
                {resultUrl && !isRendering && (
                  <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                      Synthesis Complete
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 rounded-[2.5rem] bg-secondary/30 border border-border relative overflow-hidden flex items-center justify-center shadow-inner group-hover:border-primary/20 transition-all duration-700">
                {isRendering ? (
                  <div className="text-center relative">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                      <div className="absolute inset-0 border-4 border-primary/5 rounded-full scale-150"></div>
                      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/30"></div>
                      <div className="absolute inset-4 border-2 border-primary/10 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                      <div className="absolute inset-8 border-2 border-primary/5 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] animate-pulse"></div>
                    </div>
                    <p className="text-primary font-bold uppercase tracking-[0.6em] text-[11px] animate-pulse">
                      Synthesizing Assets
                    </p>
                  </div>
                ) : resultUrl ? (
                  <div className="w-full h-full relative group/result p-4">
                    <img
                      src={resultUrl}
                      alt="Rendered Result"
                      className="w-full h-full object-contain animate-fade-in transition-all duration-1000 group-hover/result:scale-[1.02]"
                    />

                    {/* Floating Download Action */}
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover/result:opacity-100 transition-all duration-500 translate-y-4 group-hover/result:translate-y-0">
                      <button
                        onClick={handleDownload}
                        className="bg-primary text-primary-foreground px-8 py-5 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-4 backdrop-blur-md font-bold"
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
                        <span className="text-[11px] uppercase tracking-widest">
                          Export Asset
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-primary/10 relative overflow-hidden group/empty rotate-12 group-hover:rotate-0 transition-all duration-700 shadow-xl">
                      <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/empty:translate-y-0 transition-transform duration-700"></div>
                      <svg
                        className="w-10 h-10 text-primary/40 relative z-10"
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
                    <p className="text-muted-foreground/40 text-[11px] font-bold uppercase tracking-[0.4em] leading-loose max-w-sm mx-auto">
                      Projection Matrix Empty
                      <br />
                      <span className="text-primary/20">
                        Awaiting Neural Input
                      </span>
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
