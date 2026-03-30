"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profession, TonePreference } from "@/lib/types";
import {
  ArrowRight,
  Check,
  Upload,
  ChevronRight,
} from "lucide-react";

const PROFESSIONS: { value: Profession; label: string }[] = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "writer", label: "Writer" },
  { value: "consultant", label: "Consultant" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "other", label: "Other" },
];

const TONE_OPTIONS: {
  value: TonePreference;
  label: string;
  desc: string;
}[] = [
  {
    value: "professional",
    label: "Professional & Polished",
    desc: "Formal and structured",
  },
  {
    value: "friendly",
    label: "Friendly & Approachable",
    desc: "Warm and conversational",
  },
  {
    value: "confident",
    label: "Confident & Direct",
    desc: "Bold and straightforward",
  },
];

const BRAND_COLORS = [
  { name: "blue", hex: "#3b82f6" },
  { name: "purple", hex: "#a855f7" },
  { name: "teal", hex: "#14b8a6" },
  { name: "green", hex: "#22c55e" },
  { name: "orange", hex: "#f97316" },
  { name: "red", hex: "#ef4444" },
  { name: "black", hex: "#000000" },
];

type Step = 1 | 2 | 3;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Tell us about you
  const [profession, setProfession] = useState<Profession>("developer");
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Step 2: Your services
  const [services, setServices] = useState("");
  const [tone, setTone] = useState<TonePreference>("professional");

  // Step 3: Brand it
  const [brandColor, setBrandColor] = useState("#3b82f6");
  const [customHex, setCustomHex] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleStep1Continue = () => {
    if (profession && hourlyRate > 0) {
      setCurrentStep(2);
    }
  };

  const handleStep2Continue = () => {
    if (services.trim()) {
      setCurrentStep(3);
    }
  };

  const handleStep3Complete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign in again.");
        setLoading(false);
        router.push("/login");
        return;
      }

      const finalBrandColor = customHex ? "#" + customHex : brandColor;
      const userName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Freelancer";

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${user.id}/logo.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("logos").getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      // Create freelancer profile
      const slug = slugify(userName) + "-" + user.id.slice(0, 6);

      const { error: insertError } = await supabase
        .from("freelancers")
        .insert({
          user_id: user.id,
          name: userName,
          email: user.email!,
          profession,
          hourly_rate: hourlyRate,
          tone,
          services,
          brand_color: finalBrandColor,
          logo_url: logoUrl,
          portfolio_url: portfolioUrl || null,
          slug,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {currentStep === 1 && "Tell us about you"}
            {currentStep === 2 && "Your services"}
            {currentStep === 3 && "Brand your portal"}
          </h1>
          <p className="text-slate-600">
            Step {currentStep} of 3 — Complete in under 60 seconds
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-500 ${
                  step < currentStep
                    ? "w-full bg-blue-600"
                    : step === currentStep
                      ? "w-full bg-blue-400"
                      : "w-0 bg-slate-300"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200/50">
          {/* Step 1: Tell us about you */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  What&apos;s your profession?
                </label>
                <select
                  value={profession}
                  onChange={(e) =>
                    setProfession(e.target.value as Profession)
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  {PROFESSIONS.map((prof) => (
                    <option key={prof.value} value={prof.value}>
                      {prof.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  What&apos;s your hourly rate?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
                    /hr
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Portfolio URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://portfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <button
                onClick={handleStep1Continue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-8"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Your services */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  What key services do you offer?
                </label>
                <textarea
                  placeholder="e.g., Custom web development, UI/UX design, React consulting, etc."
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  {services.length} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  How should your portal feel?
                </label>
                <div className="space-y-3">
                  {TONE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center p-3 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition"
                      style={{
                        borderColor:
                          tone === option.value ? "#3b82f6" : undefined,
                        backgroundColor:
                          tone === option.value ? "#eff6ff" : undefined,
                      }}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={option.value}
                        checked={tone === option.value}
                        onChange={(e) =>
                          setTone(e.target.value as TonePreference)
                        }
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {option.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Continue}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Brand it */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Pick a brand color
                </label>
                <div className="flex gap-3 mb-4">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setBrandColor(color.hex);
                        setCustomHex("");
                      }}
                      className="w-10 h-10 rounded-lg transition transform hover:scale-110 border-2"
                      style={{
                        backgroundColor: color.hex,
                        borderColor:
                          brandColor === color.hex && !customHex
                            ? "#000"
                            : "transparent",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                      #
                    </span>
                    <input
                      type="text"
                      placeholder="3b82f6"
                      value={customHex}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHex(val);
                        if (/^[0-9a-fA-F]{6}$/.test(val)) {
                          setBrandColor("#" + val);
                        }
                      }}
                      maxLength={6}
                      className="w-full pl-7 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  {customHex && /^[0-9a-fA-F]{6}$/.test(customHex) && (
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-slate-300"
                      style={{ backgroundColor: "#" + customHex }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Upload your logo (optional)
                </label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer relative"
                  onClick={() =>
                    document.getElementById("logo-input")?.click()
                  }
                >
                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setLogoFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                  {logoFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-slate-700">
                        {logoFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-xs text-slate-500">
                        PNG, JPG or GIF (max 2MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  Preview
                </p>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div
                      className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: customHex
                          ? "#" + customHex
                          : brandColor,
                      }}
                    >
                      FD
                    </div>
                    <h3 className="font-semibold text-slate-900">
                      Your Portal
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {profession} — ${hourlyRate}/hr
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={handleStep3Complete}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? "Launching..." : "Launch Your ScopePad"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
