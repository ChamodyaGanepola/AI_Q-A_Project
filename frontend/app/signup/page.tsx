"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotification } from "../components/NotificationContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("User");
  const router = useRouter();
  const { notify } = useNotification();

  const signup = async () => {
    setError("");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (data.token && data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      notify("Signup successful", "success");
      router.push("/chat");
    } else {
      const errorMessage = data.error || data.message || "Signup failed";
      setError(errorMessage);
      notify(errorMessage, "error");
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      signup();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Signup Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">Create Account</h1>
          <p className="text-gray-500 mt-2">Sign up to get started</p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            placeholder="Enter email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
  className="border border-gray-300 rounded-xl px-4 py-3 text-black"
  value={role}
  onChange={(e) => setRole(e.target.value)}
>
  <option value="User">User</option>
  <option value="Admin">Admin</option>
</select>

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <input
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black text-black"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={signup}
            disabled={loading}
            className="bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-medium disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-black font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
