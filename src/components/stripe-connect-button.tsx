"use client";

import React, { useState } from "react";
import { LinkIcon, CheckCircle, Loader } from "lucide-react";

interface StripeConnectButtonProps {
  freelancerId: string;
  onSuccess?: (stripeAccountId: string) => void;
  onError?: (error: string) => void;
  isConnected?: boolean;
  stripeAccountId?: string | null;
}

export function StripeConnectButton({
  freelancerId,
  onSuccess,
  onError,
  isConnected = false,
  stripeAccountId,
}: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current URL to use as redirect
      const redirectUrl = new URL("/dashboard/settings", window.location.origin)
        .toString();

      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freelancerId,
          redirectUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate Stripe Connect");
      }

      const data = await response.json();
      const { url, stripeAccountId: newAccountId } = data;

      // Redirect to Stripe Connect onboarding
      if (url) {
        window.location.href = url;
        onSuccess?.(newAccountId);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected && stripeAccountId) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium cursor-default"
        >
          <CheckCircle size={18} />
          Stripe Account Connected
        </button>
        <p className="text-xs text-gray-500">Account ID: {stripeAccountId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <LinkIcon size={18} />
            Connect Stripe Account
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-600">
        Connect your Stripe account to accept payments from clients. You'll be
        redirected to Stripe to complete the setup.
      </p>
    </div>
  );
}
