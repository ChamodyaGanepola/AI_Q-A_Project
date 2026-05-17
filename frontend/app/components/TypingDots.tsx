"use client";

export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white shadow w-fit">
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
    </div>
  );
}