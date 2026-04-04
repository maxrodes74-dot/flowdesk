"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/garden");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Create new password
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enter a new password for your account
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700/50 text-green-300 text-sm rounded-lg p-3 flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>Password updated successfully! Redirecting...</span>
        </div>
      )}

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              New password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              At least 6 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
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
            <Check className="w-4 h-4" />
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
