"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import LogoutButton from "./LogoutButton";
import UserProfile from "./userProfile";
import { useNotification } from "./NotificationContext";
import { API_URL } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const { notify } = useNotification();

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      loadChatHistory(offset, true);
    }
  }, [hasMore, loading, offset]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async (currentOffset = 0, append = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
const res = await fetch(`${API_URL}/api/chat/history?limit=20&offset=${currentOffset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        const newMessages: Message[] = [];
        data.chatHistory.forEach((chat: any) => {
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
          // For scroll up: newMessages are older messages sorted newest first, reverse to oldest first, prepend
          setMessages(prev => [...newMessages.reverse(), ...prev]);
        } else {
          // Initial load: newMessages are newest first, reverse to oldest first
          setMessages(newMessages.reverse());
        }
        setHasMore(data.hasMore);
        setOffset(currentOffset + 20);
      }
    } catch (error) {
      console.error("Failed to load chat history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token) return;

    try {
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser({ name: userData.name || "User", role: userData.role || "User" });
      } else {
        // Fallback to decoding from token if user data not in localStorage
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ name: payload.name || "User", role: payload.role || "User" });
      }
    } catch (err) {
      console.error("Failed to decode token or get user data", err);
    }

    // Load initial chat history
    loadChatHistory();
  }, []);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

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
        const errorMessage = data.error || "Failed to send message";
        notify(errorMessage, "error");
        return;
      }

      const aiMessage: Message = {
        id: `temp-ai-${Date.now()}`,
        role: "ai",
        content: data.reply,
        timestamp: new Date().toLocaleString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message", error);
      notify("Unable to send message. Please try again.", "error");
    }
  };

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
      notify("Document uploaded successfully", "success");
    } else {
      const errorMessage = data.error || "Upload failed.";
      setStatus(errorMessage);
      notify(errorMessage, "error");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">
                {user?.role?.toLowerCase() === "admin" ? "Admin Upload" : "AI Chat"}
              </h1>
              <p className="text-sm text-gray-600">
                Logged in as {user?.role?.toLowerCase() === "admin" ? "Admin" : "User"}
              </p>
            </div>
            <UserProfile username={user?.name || "Guest"} />
          </div>

          <LogoutButton />
        </div>

        { user?.role?.toLowerCase() === "admin" ? (
          <div className="p-8 flex flex-col gap-6 items-center justify-center h-full bg-gray-100">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-4">Upload PDF or DOCX</h2>
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <button
                  onClick={uploadDocument}
                  className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
                >
                  Upload Document
                </button>
                {status && <p className="text-sm text-gray-700">{status}</p>}
                <p className="text-sm text-gray-500">
                  Only PDF and DOCX files are supported.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
              {loading && messages.length === 0 && <p className="text-center">Loading...</p>}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="flex flex-col max-w-[70%]">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow text-sm ${
                        m.role === "user"
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white flex gap-3">
              <input
                className="flex-1 border rounded-xl px-4 py-3 outline-none text-black"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
              />

              <button
                onClick={sendMessage}
                className="bg-black text-white px-6 rounded-xl hover:bg-gray-800 transition"
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