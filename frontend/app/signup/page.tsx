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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("User");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { notify } = useNotification();

  const signup = async () => {
    if (loading) return;

    setError("");

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

    try {
      const { data } = await apiFetch<AuthResponse>("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

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
    void signup();
  };

  return (
    <div className="app-shell">
      <div className="panel w-full max-w-md p-7 sm:p-8">
        <div className="mb-8">
          <BrandLockup subtitle="Create an account to ask document and currency questions." />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#0b1c24]">
            Create account
          </h1>
          <p className="text-[#5b737c] mt-1.5 text-sm leading-relaxed">
            Sign up to get started in seconds.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="signup-name">
              Name
            </label>
            <input
              id="signup-name"
              className="field"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="label" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
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
            <label className="label" htmlFor="signup-role">
              Role
            </label>
            <select
              id="signup-role"
              className="field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                className="field pr-16"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                autoComplete="new-password"
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

          <div>
            <label className="label" htmlFor="signup-confirm">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              className="field"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
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
            {loading ? "Creating account…" : "Sign up"}
          </button>

          <p className="text-center text-sm text-[#5b737c] mt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#0a6e60] font-semibold hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
