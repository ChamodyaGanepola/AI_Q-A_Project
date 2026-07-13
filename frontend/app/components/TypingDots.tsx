"use client";

export default function TypingDots() {
  return (
    <div
      className="message-enter flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#d5e6e3] shadow-sm w-fit"
      aria-label="AI is typing"
      role="status"
    >
      <span className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-[#0f9f8a] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-[#0e7490] rounded-full animate-bounce" />
    </div>
  );
}
