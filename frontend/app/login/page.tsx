"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotification } from "../components/NotificationContext";
import { apiFetch } from "../lib/api";
import BrandLockup from "../components/BrandLockup";

type AuthResponse = {
  token?: string;
  user?: { id: string; name: string; email: string; role: string };
  error?: string;
  message?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { notify } = useNotification();

  const login = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

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
    } catch {
      const errorMessage = "Unable to reach the server";
      setError(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void login();
  };

  return (
    <div className="app-shell">
      <div className="panel w-full max-w-md p-7 sm:p-8">
        <div className="mb-8">
          <BrandLockup subtitle="Knowledge + currency answers in one place." />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#0b1c24]">
            Welcome back
          </h1>
          <p className="text-[#5b737c] mt-1.5 text-sm leading-relaxed">
            Sign in to continue your conversation.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="field"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                className="field pr-16"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0f9f8a] hover:text-[#0a6e60] px-2 py-1 rounded-md"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="text-rose-700 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2"
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary mt-1">
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-[#5b737c] mt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#0a6e60] font-semibold hover:underline underline-offset-2"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
