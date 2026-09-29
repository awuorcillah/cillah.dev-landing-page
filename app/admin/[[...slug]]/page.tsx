"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically load TinaAdmin with no SSR
const TinaAdmin = dynamic(
  () => import("tinacms").then((mod) => {
    if (!mod || !mod.TinaAdmin) {
      throw new Error("TinaAdmin component is not exported from tinacms package");
    }
    return mod.TinaAdmin;
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F9F7F6] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A66B] border-t-transparent" />
          <p className="text-sm text-white/60">Loading TinaCMS Panel...</p>
        </div>
      </div>
    )
  }
);

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [canLoad, setCanLoad] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const initializeTina = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
        
        // Check if Client ID exists and is valid
        if (!clientId || clientId === "dummy") {
          setLoading(false);
          return;
        }

        // Dynamically import the client
        const clientModule = await import("@/tina/__generated__/client");
        if (!clientModule || !clientModule.client) {
          throw new Error("Tina generated client is undefined. Please run a local build to compile the client.");
        }

        setCanLoad(true);
      } catch (err: any) {
        console.error("TinaCMS Admin dynamic initialization failed:", err);
        setError(err?.message || "Failed to load TinaCMS client configuration");
      } finally {
        setLoading(false);
      }
    };

    initializeTina();
  }, []);

  // Prevent any hydration mismatches by returning null on first server render
  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F9F7F6] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A66B] border-t-transparent" />
          <p className="text-sm text-white/60">Initializing client configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F9F7F6] font-sans p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-heading font-medium mb-3 text-red-400">
            TinaCMS Loading Error
          </h1>
          <p className="text-sm text-[#F9F7F6]/60 leading-relaxed mb-4">
            An error occurred while attempting to dynamically load the generated client config.
          </p>
          <pre className="bg-black/40 text-left p-4 rounded text-xs font-mono border border-white/10 text-red-300 overflow-x-auto max-w-full">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!canLoad) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F9F7F6] font-sans p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-heading font-medium mb-3 text-[#C9A66B]">
            TinaCMS Admin Setup Required
          </h1>
          <p className="text-sm text-[#F9F7F6]/60 leading-relaxed">
            TinaCMS is not initialized because the required Client ID environment variable is not configured.
            Please add <code className="bg-[#1C1C1C]/80 px-1.5 py-0.5 rounded border border-white/10 text-white font-mono text-[13px]">NEXT_PUBLIC_TINA_CLIENT_ID</code> and <code className="bg-[#1C1C1C]/80 px-1.5 py-0.5 rounded border border-white/10 text-white font-mono text-[13px]">TINA_TOKEN</code> in your Vercel Project Settings and trigger a redeployment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <TinaAdmin />
    </div>
  );
}
