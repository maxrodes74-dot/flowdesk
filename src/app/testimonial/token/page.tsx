"use client";

import React, { useState, useEffect } from "react";
import { Star, AlertCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialRequest {
  freelancerName: string;
  freelancerId: string;
}

export default function TestimonialPage({
  params,
}: {
  params: { token: string };
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [clientName, setClientName] = useState("");
  const [permissionToPublish, setPermissionToPublish] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokenData, setTokenData] = useState<TestimonialRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/testimonials?token=${encodeURIComponent(params.token)}`
        );
        if (!response.ok) {
          throw new Error("Invalid token");
        }
        const data = await response.json();
        setTokenData(data);
        setLoading(false);
      } catch (err) {
        setError("Invalid or expired testimonial request link");
        setLoading(false);
      }
    };

    validateToken();
  }, [params.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 20) {
      setError("Please write at least 20 characters");
      return;
    }
    if (!clientName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!permissionToPublish) {
      setError("Please grant permission to publish");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          rating,
          text,
          clientName,
          permission_to_use: permissionToPublish,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit testimonial");
      }

      setSubmitted(true);
      setError("");
    } catch (err) {
      setError("Failed to submit testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-blue-600 mb-4" size={40} />
          <p className="text-gray-600">Loading testimonial form...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-green-600 fill-green-600" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you!
            </h1>
            <p className="text-gray-600 mb-4">
              Your testimonial has been successfully submitted. We appreciate
              your feedback!
            </p>
            <p className="text-sm text-gray-500">You can now close this window.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Share Your Feedback
            </h1>
            <p className="text-gray-600">
              We'd love to hear about your experience working with{" "}
              <span className="font-semibold">{tokenData?.freelancerName}</span>!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => {
                  setError("");
                  setClientName(e.target.value);
                }}
                placeholder="Your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                How would you rate your experience?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setError("");
                      setRating(star);
                    }}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={cn(
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Excellent"}
              </p>
            </div>

            {/* Testimonial Text */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Testimonial
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setError("");
                  setText(e.target.value);
                }}
                placeholder="Tell us about your experience..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 20 characters required
              </p>
            </div>

            {/* Permission */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionToPublish}
                  onChange={(e) => {
                    setError("");
                    setPermissionToPublish(e.target.checked);
                  }}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I give permission to publish this testimonial on the website
                  and marketing materials
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle
                  size={18}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader size={18} className="animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit Testimonial"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your feedback helps us improve our services and build trust with
              future clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
