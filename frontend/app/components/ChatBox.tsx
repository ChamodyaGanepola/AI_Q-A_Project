"use client";

import { useState } from "react";
import LogoutButton from "./LogoutButton";
import UserProfile from "./userProfile";
export default function ChatBox() {
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);

  const [input, setInput] = useState("");

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

  return (

  <div className="min-h-screen bg-black flex items-center justify-center p-4">
    
    {/* Chat Card */}
    <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-black">
            AI Chat
          </h1>

          <UserProfile username="Chamodya" />
        </div>

        <LogoutButton />
      </div>

      {/* Messages */}
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

      {/* Input */}
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
    </div>
  </div>

  );
}