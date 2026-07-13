"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MessageBubbleProps = {
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

const remarkPlugins = [remarkGfm];

function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`message-enter flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 72px" }}
    >
      <div
        className={`max-w-[85%] sm:max-w-[72%] flex flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {!isUser && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#0a6e60] px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" aria-hidden />
            AI Assistant
          </span>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm ${
            isUser
              ? "bg-gradient-to-br from-[#0f9f8a] to-[#0c7c8f] text-white rounded-br-md shadow-md shadow-teal-900/10"
              : "bg-white text-[#0b1c24] border border-[#d5e6e3] rounded-bl-md shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words m-0">{content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={remarkPlugins}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        <time className="text-[11px] text-[#8aa0a8] px-1 tabular-nums">{timestamp}</time>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
