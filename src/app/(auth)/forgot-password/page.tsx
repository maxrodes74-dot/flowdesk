"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Reset your password
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enter your email to receive a password reset link
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded-lg p-3">
          Check your email for a reset link
        </div>
      )}

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0f0d' }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <p style={{ color: 'var(--text)' }}>
            A reset link has been sent to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>
      )}

      <div className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-medium"
          style={{ color: 'var(--accent)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
