"use client";

import React, { useState } from "react";
import { Star, Copy, Download, Mail, Settings } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function TestimonialsPage() {
  const { state, dispatch } = useApp();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showWidgetCode, setShowWidgetCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    clientEmail: "",
  });

  const mockTestimonials = [
    {
      id: "t1",
      clientName: "Sarah Johnson",
      rating: 5,
      text: "Excellent service! The deliverables exceeded our expectations and the communication was seamless.",
      permissionToPublish: true,
      createdAt: "2024-03-15",
    },
    {
      id: "t2",
      clientName: "Michael Chen",
      rating: 5,
      text: "Professional, reliable, and delivers on time. Highly recommended for any serious projects.",
      permissionToPublish: true,
      createdAt: "2024-03-10",
    },
    {
      id: "t3",
      clientName: "Emma Davis",
      rating: 4,
      text: "Great work overall. Very responsive to feedback and willing to iterate.",
      permissionToPublish: true,
      createdAt: "2024-03-05",
    },
  ];

  const averageRating =
    mockTestimonials.length > 0
      ? (
          mockTestimonials.reduce((sum, t) => sum + t.rating, 0) /
          mockTestimonials.length
        ).toFixed(1)
      : 0;

  const publishedCount = mockTestimonials.filter(
    (t) => t.permissionToPublish
  ).length;

  const widgetCode = `<!-- FlowDesk Testimonials Widget -->
<div id="flowdesk-testimonials"></div>
<script src="https://flowdesk.io/widget/testimonials.js"></script>
<script>
  FlowDesk.loadTestimonials({
    freelancerId: "${state.freelancer?.id}",
    maxCount: 3,
    theme: "light"
  });
</script>`;

  const handleRequestTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientEmail) {
      alert(
        `Testimonial request sent to ${formData.clientEmail}. They'll receive a link to submit their feedback.`
      );
      setFormData({ clientEmail: "" });
      setShowRequestForm(false);
    }
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsJSON = () => {
    const data = JSON.stringify(
      mockTestimonials.filter((t) => t.permissionToPublish),
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-600 mt-1">Collect and showcase client testimonials</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Testimonials</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {mockTestimonials.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Average Rating</p>
          <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
            <div className="mt-1">{renderStars(Math.round(Number(averageRating)))}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Published</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{publishedCount}</p>
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
                The client will receive a personalized link to submit their testimonial.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Request
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
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
            Copy this code and paste it into your website to display your testimonials:
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
          {mockTestimonials.length > 0 ? (
            mockTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.clientName}
                    </p>
                    <div className="mt-1">{renderStars(testimonial.rating)}</div>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      testimonial.permissionToPublish
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {testimonial.permissionToPublish ? "Published" : "Private"}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{testimonial.text}</p>
                <p className="text-xs text-gray-500">
                  {new Date(testimonial.createdAt).toLocaleDateString()}
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
