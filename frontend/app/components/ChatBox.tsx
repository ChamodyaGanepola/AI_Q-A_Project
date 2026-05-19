"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import LogoutButton from "./LogoutButton";
import UserProfile from "./userProfile";
import { useNotification } from "./NotificationContext";
import { API_URL } from "../lib/api";
import TypingDots from "./TypingDots";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const { notify } = useNotification();

  const isAdmin = user?.role === "admin";

  // ---------------- SCROLL ----------------
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      loadChatHistory(offset, true);
    }
  }, [hasMore, loading, offset]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- LOAD HISTORY ----------------
  const loadChatHistory = async (currentOffset = 0, append = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/chat/history?limit=20&offset=${currentOffset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (res.ok) {
        const newMessages: Message[] = [];

        data.chatHistory.reverse().forEach((chat: any) => {
          newMessages.push({
            id: `${chat._id}-user`,
            role: "user",
            content: chat.message,
            timestamp: new Date(chat.createdAt).toLocaleString(),
          });

          newMessages.push({
            id: `${chat._id}-ai`,
            role: "ai",
            content: chat.reply,
            timestamp: new Date(chat.createdAt).toLocaleString(),
          });
        });

        if (append) {
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }

        setHasMore(data.hasMore);
        setOffset(currentOffset + 20);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- INIT ----------------
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
          name: payload.name || "User",
          role: (payload.role || "User").toLowerCase(),
        });
      }
    } catch (err) {
      console.error(err);
    }

    loadChatHistory();
  }, []);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!input.trim()) return;

    const currentInput = input;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
      timestamp: new Date().toLocaleString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setAiTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: currentInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify(data.error || "Failed", "error");
        return;
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: data.reply,
        timestamp: new Date().toLocaleString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      notify("Error sending message", "error");
    } finally {
      setAiTyping(false);
    }
  };

  // ---------------- UPLOAD ----------------
  const uploadDocument = async () => {
    if (!file) {
      setStatus("Select a file before uploading.");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("document", file);

    const res = await fetch(`${API_URL}/api/chat/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Document uploaded successfully.");
      notify("Uploaded successfully", "success");
    } else {
      setStatus(data.error || "Upload failed");
      notify("Upload failed", "error");
    }
  };

  // =====================================================
  // UI (FIXED - NO REMOUNT BUG)
  // =====================================================
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div>
            <h1 className="text-2xl font-bold text-black">
              {isAdmin ? "Admin Upload" : "AI Chat"}
            </h1>
            <p className="text-sm text-gray-600">
              Logged in as {user?.role}
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* BODY */}
        {isAdmin ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow">
              <UserProfile username={user?.name || "User"} />

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />

              <button
                onClick={uploadDocument}
                className="bg-black text-white px-4 py-2 rounded-xl mt-4"
              >
                Upload Document
              </button>

              {status && <p className="text-sm mt-2">{status}</p>}
            </div>
          </div>
        ) : (
          <>
            {/* CHAT */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100"
            >
              {loading && messages.length === 0 && (
                <p className="text-center">Loading...</p>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[70%]">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm shadow ${
                        m.role === "user"
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-xs text-gray-500">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {aiTyping && (
                <div className="flex justify-start">
                  <TypingDots />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t bg-white flex gap-3">
              <input
                className="flex-1 border rounded-xl px-4 py-3 text-black"
                value={input ?? ""}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message..."
              />

              <button
                onClick={sendMessage}
                className="bg-black text-white px-6 rounded-xl"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}