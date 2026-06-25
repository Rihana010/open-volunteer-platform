"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Invalid admin email or password.");
      return;
    }

    const data = await response.json();

    if (data.mustChangePassword) {
      router.push("/admin/change-password");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--ovp-blue)]">
          admin
        </p>

        <h1 className="text-3xl font-bold text-slate-950">Admin Login</h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter your approved admin email and password to continue.
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Email address
          </span>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="name@weke.com"
            required
          />
        </label>

       <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </span>

        <div className="flex rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-l-xl px-3 py-2 outline-none"
            placeholder="Enter admin password"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="rounded-r-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-900 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded-xl bg-[var(--ovp-blue)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--ovp-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}