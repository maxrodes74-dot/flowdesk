"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreelancerData {
  id: string;
  name: string;
  profession: string;
  hourlyRate: number;
  description: string;
  services: string[];
  testimonials: Array<{
    clientName: string;
    text: string;
    rating: number;
  }>;
}

export default function ReferralPage({
  params,
}: {
  params: { code: string };
}) {
  const [referralCode] = useState(params.code);
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFreelancer = async () => {
      try {
        const response = await fetch(
          `/api/referrals?code=${encodeURIComponent(referralCode)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch referral data");
        }
        const data = await response.json();
        setFreelancer(data.freelancer);
      } catch (err) {
        setError("Invalid or expired referral code");
        setLoading(false);
      }
    };

    fetchFreelancer();
  }, [referralCode]);

  const handleSignUp = () => {
    const signupUrl = `/auth/signup?referral_code=${encodeURIComponent(
      referralCode
    )}`;
    window.location.href = signupUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading referral information...</p>
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Referral Link
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "This referral link is no longer valid."}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const benefits = [
    {
      title: "Get 20% discount",
      description: "On your first project with this freelancer",
      icon: "💰",
    },
    {
      title: "Risk-free trial",
      description: "If you're not satisfied, we offer a full refund",
      icon: "✓",
    },
    {
      title: "Dedicated support",
      description: "Our team ensures a smooth collaboration",
      icon: "🎯",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ScopePad
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Intro */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            Exclusive Offer
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Meet {freelancer.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            A trusted freelancer recommended by a colleague. Start your first
            project with a special discount.
          </p>
        </div>

        {/* Freelancer Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {freelancer.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{freelancer.profession}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${freelancer.hourlyRate}/hr
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{freelancer.description}</p>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {freelancer.services.map((service, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              {freelancer.testimonials.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Client Testimonials
                  </h3>
                  <div className="space-y-4">
                    {freelancer.testimonials.map((testimonial, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {testimonial.clientName}
                          </p>
                          <span className="text-yellow-400">
                            {"★".repeat(testimonial.rating)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {testimonial.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benefits & CTA */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="mb-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Special Referral Offer
                  </p>
                  <p className="text-4xl font-bold text-blue-600">20%</p>
                  <p className="text-gray-600">Off Your First Project</p>
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-3">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xl">{benefit.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {benefit.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSignUp}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                Get Started
                <ArrowRight size={18} />
              </button>

              <p className="text-xs text-gray-500 text-center">
                Referral code:{" "}
                <span className="font-mono font-semibold">{referralCode}</span>
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: "Sign Up",
                description: "Create your ScopePad account with the referral code",
              },
              {
                step: 2,
                title: "Create Project",
                description: "Post your project details and requirements",
              },
              {
                step: 3,
                title: "Get 20% Discount",
                description: "Your discount applies automatically to first invoice",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
