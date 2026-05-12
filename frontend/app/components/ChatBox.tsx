"use client";

import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";
import UserProfile from "./userProfile";
export default function ChatBox() {
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ username: payload.username || "User", role: payload.role || "user" });
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }, []);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages([
      ...messages,
      { role: "user", content: input },
      { role: "ai", content: data.reply },
    ]);

    setInput("");
  };

  const uploadDocument = async () => {
    if (!file) {
      setStatus("Select a file before uploading.");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("document", file);

    const res = await fetch("http://localhost:5000/api/chat/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Document uploaded successfully.");
    } else {
      setStatus(data.error || "Upload failed.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">
                {user?.role === "admin" ? "Admin Upload" : "AI Chat"}
              </h1>
              <p className="text-sm text-gray-600">
                Logged in as {user?.role === "admin" ? "Admin" : "User"}
              </p>
            </div>
            <UserProfile username={user?.username || "Guest"} />
          </div>

          <LogoutButton />
        </div>

        {user?.role === "admin" ? (
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl shadow text-sm ${
                      m.role === "user"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
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