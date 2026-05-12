"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const login = async () => {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);

      router.push("/chat");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to continue chatting
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            type="password"
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-medium"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}