"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import LogoutButton from "./LogoutButton";
import UserProfile from "./userProfile";
import { useNotification } from "./NotificationContext";
import { apiFetch, authHeaders } from "../lib/api";
import TypingDots from "./TypingDots";
import MessageBubble from "./MessageBubble";
import BrandLockup from "./BrandLockup";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

type HistoryResponse = {
  chatHistory: Array<{
    _id: string;
    message: string;
    reply: string;
    createdAt: string;
  }>;
  hasMore: boolean;
  error?: string;
};

type ChatResponse = {
  reply?: string;
  error?: string;
};

type UploadResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

function mapHistoryToMessages(
  chatHistory: HistoryResponse["chatHistory"]
): Message[] {
  const mapped: Message[] = [];

  for (const chat of chatHistory) {
    const stamp = new Date(chat.createdAt).toLocaleString();
    mapped.push({
      id: `${chat._id}-user`,
      role: "user",
      content: chat.message,
      timestamp: stamp,
    });
    mapped.push({
      id: `${chat._id}-ai`,
      role: "ai",
      content: chat.reply,
      timestamp: stamp,
    });
  }

  return mapped;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const { notify } = useNotification();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const loadChatHistory = useCallback(async (currentOffset = 0, append = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    loadingRef.current = true;

    const container = messagesContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;

    try {
      const { ok, data } = await apiFetch<HistoryResponse>(
        `/api/chat/history?limit=20&offset=${currentOffset}`,
        { headers: authHeaders() }
      );

      if (ok && data.chatHistory) {
        const newMessages = mapHistoryToMessages([...data.chatHistory].reverse());

        if (append) {
          setMessages((prev) => [...newMessages, ...prev]);
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - previousHeight;
            }
          });
        } else {
          setMessages(newMessages);
          shouldStickToBottomRef.current = true;
        }

        setHasMore(Boolean(data.hasMore));
        hasMoreRef.current = Boolean(data.hasMore);
        setOffset(currentOffset + 20);
        offsetRef.current = currentOffset + 20;
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;

    if (container.scrollTop <= 24 && hasMoreRef.current && !loadingRef.current) {
      void loadChatHistory(offsetRef.current, true);
    }
  }, [loadChatHistory]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll, isAdmin]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token) return;

    try {
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser({
          name: userData.name || "User",
          role: (userData.role || "User").toLowerCase(),
        });
      } else {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          name: payload.name || payload.username || "User",
          role: (payload.role || "User").toLowerCase(),
        });
      }
    } catch (err) {
      console.error(err);
    }

    void loadChatHistory();
  }, [loadChatHistory]);

  const sendMessage = async () => {
    if (!input.trim() || aiTyping) return;

    const currentInput = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
      timestamp: new Date().toLocaleString(),
    };

    shouldStickToBottomRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAiTyping(true);

    try {
      const { ok, data } = await apiFetch<ChatResponse>("/api/chat", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ message: currentInput }),
      });

      if (!ok) {
        notify(data.error || "Failed", "error");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: data.reply || "",
          timestamp: new Date().toLocaleString(),
        },
      ]);
    } catch {
      notify("Error sending message", "error");
    } finally {
      setAiTyping(false);
    }
  };

  const uploadDocument = async () => {
    if (!file) {
      setStatus("Select a file before uploading.");
      return;
    }

    setUploading(true);
    setStatus("Uploading…");

    const formData = new FormData();
    formData.append("document", file);

    try {
      const { ok, data } = await apiFetch<UploadResponse>("/api/chat/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (ok) {
        setStatus("Document uploaded successfully.");
        notify("Uploaded successfully", "success");
        setFile(null);
      } else {
        setStatus(data.error || "Upload failed");
        notify("Upload failed", "error");
      }
    } catch {
      setStatus("Upload failed");
      notify("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const canSend = input.trim().length > 0 && !aiTyping;

  return (
    <div className="app-shell">
      <div className="panel w-full max-w-4xl h-[min(85dvh,900px)] flex flex-col overflow-hidden">
        <header className="flex justify-between items-center gap-4 px-5 sm:px-6 py-4 border-b border-[#d5e6e3] bg-gradient-to-r from-[#f3fbf9] to-[#eef7fb]">
          <div className="min-w-0">
            <BrandLockup
              compact
              subtitle={
                isAdmin
                  ? "Admin · knowledge base upload"
                  : user
                    ? `${user.name} · ${user.role}`
                    : "Loading session…"
              }
            />
            <h1 className="sr-only">{isAdmin ? "Admin Upload" : "AI Chat"}</h1>
          </div>
          <LogoutButton />
        </header>

        {isAdmin ? (
          <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[var(--surface-chat)]">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#d5e6e3] p-6 sm:p-8 shadow-sm">
              <UserProfile username={user?.name || "User"} />

              <div className="mt-6 space-y-3">
                <h2 className="text-base font-semibold text-[#0b1c24]">Upload document</h2>
                <p className="text-sm text-[#5b737c]">
                  Add a PDF or DOCX file to expand the knowledge base.
                </p>

                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#9ec9c1] bg-[#f0faf8] px-4 py-8 cursor-pointer hover:border-[#0f9f8a] hover:bg-[#e6f7f3] transition-colors">
                  <span className="text-sm font-medium text-[#0b3d4a]">
                    {file ? file.name : "Choose a PDF or DOCX file"}
                  </span>
                  <span className="text-xs text-[#5b737c]">Click to browse</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="sr-only"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setStatus("");
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={uploadDocument}
                  disabled={uploading || !file}
                  className="btn btn-primary w-full"
                >
                  {uploading ? "Uploading…" : "Upload Document"}
                </button>

                {status && (
                  <p
                    className={`text-sm ${
                      status.toLowerCase().includes("success")
                        ? "text-emerald-600"
                        : status.toLowerCase().includes("fail") ||
                            status.toLowerCase().includes("select")
                          ? "text-rose-600"
                          : "text-[#5b737c]"
                    }`}
                    role="status"
                  >
                    {status}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="chat-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--surface-chat)]"
              aria-live="polite"
            >
              {loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[#5b737c]">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot" />
                    <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#14b8a6] loading-dot [animation-delay:0.4s]" />
                  </div>
                  <p className="text-sm">Loading conversation…</p>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="brand-mark mb-3" aria-hidden>
                    Q
                  </div>
                  <p className="text-lg font-semibold text-[#0b1c24]">Ask anything</p>
                  <p className="text-sm text-[#5b737c] mt-1 max-w-sm">
                    Try document questions or currency conversions like “Convert 100 USD to LKR”.
                  </p>
                </div>
              )}

              {loading && messages.length > 0 && (
                <p className="text-center text-xs text-[#5b737c] py-1">
                  Loading earlier messages…
                </p>
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  timestamp={m.timestamp}
                />
              ))}

              {aiTyping && (
                <div className="flex justify-start">
                  <TypingDots />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="p-3 sm:p-4 border-t border-[#d5e6e3] bg-white"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
            >
              <div className="flex gap-2 sm:gap-3 items-end">
                <label className="sr-only" htmlFor="chat-input">
                  Message
                </label>
                <textarea
                  id="chat-input"
                  rows={1}
                  className="field flex-1 resize-none min-h-[48px] max-h-32 py-3"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about documents or currency…"
                  disabled={aiTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="btn btn-primary px-5 sm:px-6 h-12 shrink-0"
                  aria-label="Send message"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#8aa0a8] hidden sm:block">
                Press Enter to send · Shift+Enter for a new line
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
