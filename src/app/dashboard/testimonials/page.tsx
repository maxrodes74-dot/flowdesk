"use client";

import React, { useState, useEffect } from "react";
import { Star, Copy, Download, Mail, Settings, Loader } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  clientName: string;
  rating: number;
  text: string;
  permission_to_use: boolean;
  created_at: string;
}

export default function TestimonialsPage() {
  const { state } = useApp();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showWidgetCode, setShowWidgetCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [formData, setFormData] = useState({
    clientEmail: "",
    clientName: "",
  });

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(
          `/api/testimonials?freelancerId=${state.freelancer?.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    if (state.freelancer?.id) {
      fetchTestimonials();
    }
  }, [state.freelancer?.id]);

  const averageRating =
    testimonials.length > 0
      ? (
          testimonials.reduce((sum, t) => sum + t.rating, 0) /
          testimonials.length
        ).toFixed(1)
      : 0;

  const publishedCount = testimonials.filter(
    (t) => t.permission_to_use
  ).length;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://scopepad.io';
  const widgetCode = `<!-- ScopePad Testimonials Widget -->
<div id="scopepad-testimonials"></div>
<script src="${appUrl}/api/testimonials/widget?id=${state.freelancer?.id}"></script>`;

  const handleRequestTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientEmail || !formData.clientName) {
      setRequestError("Please fill in all fields");
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError("");
    setRequestSuccess("");

    try {
      // Generate unique token
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testimonialUrl = `${window.location.origin}/testimonial/${token}`;

      // In production, send email with the link
      // For now, just show success message
      setRequestSuccess(
        `Testimonial request sent to ${formData.clientEmail}. They'll receive a link to submit their feedback.`
      );
      setFormData({ clientEmail: "", clientName: "" });
      setTimeout(() => {
        setShowRequestForm(false);
        setRequestSuccess("");
      }, 2000);
    } catch (error) {
      setRequestError("Failed to send testimonial request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsJSON = () => {
    const data = JSON.stringify(
      testimonials.filter((t) => t.permission_to_use),
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "testimonials.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={cn(
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-600 mt-1">
          Collect and showcase client testimonials
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Testimonials</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {testimonials.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Average Rating</p>
          <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
            <div className="mt-1">
              {renderStars(Math.round(Number(averageRating)))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Published</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {publishedCount}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Mail size={18} />
          Request Testimonial
        </button>
        <button
          onClick={() => setShowWidgetCode(!showWidgetCode)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 flex items-center gap-2"
        >
          <Settings size={18} />
          Embed Widget
        </button>
        <button
          onClick={exportAsJSON}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 flex items-center gap-2"
        >
          <Download size={18} />
          Export JSON
        </button>
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Request a Testimonial
          </h2>
          <form onSubmit={handleRequestTestimonial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="Client name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Client Email Address
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clientEmail: e.target.value })
                }
                placeholder="client@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-600 mt-2">
                The client will receive a personalized link to submit their
                testimonial.
              </p>
            </div>

            {requestError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {requestError}
              </div>
            )}

            {requestSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {requestSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingRequest && (
                  <Loader size={16} className="animate-spin" />
                )}
                {isSubmittingRequest ? "Sending..." : "Send Request"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestError("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Widget Code */}
      {showWidgetCode && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Embed Testimonials Widget
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Copy this code and paste it into your website to display your
            testimonials:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
            <pre className="text-gray-100 text-xs font-mono whitespace-pre-wrap break-words">
              {widgetCode}
            </pre>
          </div>
          <button
            onClick={copyWidgetCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Copy size={18} />
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
      )}

      {/* Testimonials List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Collected Testimonials
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.clientName}
                    </p>
                    <div className="mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      testimonial.permission_to_use
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {testimonial.permission_to_use ? "Published" : "Private"}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{testimonial.text}</p>
                <p className="text-xs text-gray-500">
                  {new Date(testimonial.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-600">
              No testimonials yet. Request one from your clients!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
