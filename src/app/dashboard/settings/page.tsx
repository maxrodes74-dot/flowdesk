"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Upload,
  Trash2,
  Bell,
  Zap,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Profession =
  | "developer"
  | "designer"
  | "writer"
  | "consultant"
  | "photographer"
  | "videographer"
  | "other";

type TonePreference = "professional" | "friendly" | "confident";

type SettingsTab = "profile" | "branding" | "billing" | "integrations" | "notifications" | "automations";

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const freelancer = state.freelancer;

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [formData, setFormData] = useState({
    name: freelancer?.name || "",
    email: freelancer?.email || "",
    profession: freelancer?.profession || ("developer" as Profession),
    hourlyRate: freelancer?.hourlyRate || 100,
    services: freelancer?.services || "",
    tone: freelancer?.tone || ("professional" as TonePreference),
    brandColor: freelancer?.brandColor || "#2563eb",
    portfolioUrl: freelancer?.portfolioUrl || "",
  });

  const [notifications, setNotifications] = useState({
    proposalSent: true,
    invoicePaid: true,
    messageReceived: true,
    paymentReminder: true,
    weeklyReport: true,
  });

  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const professions: Profession[] = [
    "developer",
    "designer",
    "writer",
    "consultant",
    "photographer",
    "videographer",
    "other",
  ];

  const tones: TonePreference[] = ["professional", "friendly", "confident"];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "hourlyRate") {
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    if (freelancer) {
      dispatch({
        type: "SET_FREELANCER",
        payload: {
          ...freelancer,
          ...formData,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure? This action cannot be undone. All your data will be deleted."
      )
    ) {
      alert("Account deletion is not implemented in this demo.");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: "👤" },
    { id: "branding" as const, label: "Branding", icon: "🎨" },
    { id: "billing" as const, label: "Billing", icon: "💳" },
    { id: "integrations" as const, label: "Integrations", icon: "🔗" },
    { id: "notifications" as const, label: "Notifications", icon: "🔔" },
    { id: "automations" as const, label: "Automations", icon: "⚡" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile, branding, and account settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-0.5",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Profession
                </label>
                <select
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {professions.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof.charAt(0).toUpperCase() + prof.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Services
                </label>
                <textarea
                  name="services"
                  value={formData.services}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="List your services, separated by commas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Communication Tone
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {tones.map((tone) => (
                    <label
                      key={tone}
                      className="relative flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={tone}
                        checked={formData.tone === tone}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border-2 text-center font-medium transition-colors",
                          formData.tone === tone
                            ? "border-blue-600 bg-blue-50 text-blue-900"
                            : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                        )}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="brandColor"
                    value={formData.brandColor}
                    onChange={handleInputChange}
                    className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Logo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {freelancer?.logoUrl ? (
                    <div className="space-y-4">
                      <img
                        src={freelancer.logoUrl}
                        alt="Logo"
                        className="h-16 mx-auto"
                      />
                      <p className="text-sm text-gray-600">Logo uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg"
                    className="hidden"
                  />
                  <button
                    onClick={(e) =>
                      e.currentTarget.parentElement?.querySelector("input")?.click()
                    }
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Current Plan</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Free Plan</p>
                    <p className="text-sm text-gray-600">
                      Basic features for getting started
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-900 text-xs font-semibold rounded-full">
                    Current
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Usage Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Clients Created</span>
                    <span className="font-semibold">{state.clients.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">
                      AI Generations This Month
                    </span>
                    <span className="font-semibold">
                      {freelancer?.aiGenerationsUsedThisMonth || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Upgrade</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-900">
                    Pro - $9/mo
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-900">
                    Pro+ - $19/mo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Stripe Connect
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Stripe account to accept payments from clients
                </p>
                {freelancer?.stripeAccountId ? (
                  <button className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg">
                    Connected as {freelancer.stripeAccountId}
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Connect Stripe Account
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Zapier Integration
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Automate your workflow by connecting to thousands of apps
                </p>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-900">
                  Connect Zapier
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-2xl">
              <p className="text-gray-600 text-sm">
                Choose which email notifications you'd like to receive
              </p>

              {[
                {
                  key: "proposalSent" as const,
                  label: "Proposal Sent",
                  description: "When you send a proposal to a client",
                },
                {
                  key: "invoicePaid" as const,
                  label: "Invoice Paid",
                  description: "When a client pays an invoice",
                },
                {
                  key: "messageReceived" as const,
                  label: "Message Received",
                  description: "When a client sends you a message",
                },
                {
                  key: "paymentReminder" as const,
                  label: "Payment Reminder",
                  description: "Reminders for overdue invoices",
                },
                {
                  key: "weeklyReport" as const,
                  label: "Weekly Report",
                  description: "Summary of your activity each week",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={() => handleNotificationChange(item.key)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Automations Tab */}
          {activeTab === "automations" && (
            <div className="space-y-6 max-w-2xl">
              <p className="text-gray-600 text-sm">
                Set up automation rules to streamline your workflow
              </p>

              {[
                {
                  title: "Payment Reminders",
                  description: "Automatically send payment reminders for overdue invoices",
                  enabled: true,
                  icon: "💰",
                },
                {
                  title: "Scope Creep Detection",
                  description: "Get alerted when a project may be going out of scope",
                  enabled: false,
                  icon: "⚠️",
                },
                {
                  title: "Project Wrap-up",
                  description: "Automatically request testimonials and referrals",
                  enabled: true,
                  icon: "🏁",
                },
                {
                  title: "Re-engagement",
                  description: "Reach out to inactive clients to spark new projects",
                  enabled: false,
                  icon: "💬",
                },
              ].map((automation, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <span>{automation.icon}</span>
                      {automation.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {automation.description}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Configure
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-600" />
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      )}

      {/* Save Button */}
      {(activeTab === "profile" || activeTab === "branding") && (
        <div className="flex gap-4 max-w-2xl">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-sm font-medium">Saved successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
