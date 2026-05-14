"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotification } from "../components/NotificationContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { notify } = useNotification();

  const login = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      notify("Login successful", "success");
      router.push("/chat");
    } else {
      const errorMessage = data.error || data.message || "Login failed";
      setError(errorMessage);
      notify(errorMessage, "error");
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Login to your account to continue</p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="Enter email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={login}
            disabled={loading}
            className="bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-medium disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-black font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}