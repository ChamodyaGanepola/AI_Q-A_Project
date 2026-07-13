"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    router.replace(token ? "/chat" : "/login");
  }, [router]);

  return (
    <div className="app-shell">
      <div className="relative z-10 flex flex-col items-center gap-3 text-[#9fe8db]">
        <div className="brand-mark" aria-hidden>
          Q
        </div>
        <div className="flex gap-1.5" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot" />
          <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot [animation-delay:0.2s]" />
          <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot [animation-delay:0.4s]" />
        </div>
        <p className="text-sm text-[#c7ebe4]">Loading Q&A with AI…</p>
      </div>
    </div>
  );
}
