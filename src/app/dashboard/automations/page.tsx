"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";
import type {
  PaymentReminderConfig,
  ScopeCreepConfig,
  ProjectWrapUpConfig,
  ReEngagementConfig,
} from "@/lib/types";

type AutomationState = {
  payment_reminders: PaymentReminderConfig;
  scope_creep_detection: ScopeCreepConfig;
  project_wrap_up: ProjectWrapUpConfig;
  re_engagement_ping: ReEngagementConfig;
};

const DEFAULT_CONFIGS: AutomationState = {
  payment_reminders: {
    enabled: false,
    escalationSchedule: { day1: true, day7: true, day14: true },
  },
  scope_creep_detection: {
    enabled: false,
    sensitivityLevel: "moderate",
    autoDraftChangeOrder: true,
  },
  project_wrap_up: {
    enabled: false,
    delayDays: 3,
    includeTestimonialRequest: true,
    includeReferralAsk: true,
  },
  re_engagement_ping: {
    enabled: false,
    inactivityThresholdDays: 60,
  },
};

export default function AutomationsPage() {
  const { state } = useApp();
  const [configs, setConfigs] = useState<AutomationState>(DEFAULT_CONFIGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const supabase = createClient();

  // Load configs on mount
  useEffect(() => {
    if (!state.freelancer) return;

    const loadConfigs = async () => {
      const { data: automations } = await supabase
        .from("automations")
        .select("*")
        .eq("freelancer_id", state.freelancer!.id);

      if (automations) {
        const newConfigs = { ...DEFAULT_CONFIGS };
        for (const automation of automations) {
          const type = automation.type as keyof AutomationState;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (newConfigs as any)[type] = { ...DEFAULT_CONFIGS[type], ...(automation.config as object || {}) };
        }
        setConfigs(newConfigs);
      }
    };

    loadConfigs();
  }, [state.freelancer, supabase]);

  const saveConfig = async (type: keyof AutomationState, config: unknown) => {
    if (!state.freelancer) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const { data: existing } = await supabase
        .from("automations")
        .select("id")
        .eq("freelancer_id", state.freelancer.id)
        .eq("type", type)
        .single();

      if (existing) {
        // Update
        await supabase
          .from("automations")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ config: config as any })
          .eq("id", existing.id);
      } else {
        // Insert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("automations").insert({
          freelancer_id: state.freelancer.id,
          type,
          config: config as any,
          enabled: (config as any).enabled || false,
        });
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save config:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automations</h1>
          <p className="text-gray-600">
            Set up automated workflows to save time and stay on top of your business
          </p>
        </div>

        {/* Status Messages */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="text-green-700">Configuration saved successfully</span>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-700">Failed to save configuration</span>
          </div>
        )}

        {/* Automation Cards */}
        <div className="grid gap-6">
          {/* Payment Reminders */}
          <AutomationCard
            title="Payment Reminders"
            description="Automatically send escalating payment reminders for overdue invoices"
            icon={<Clock size={24} className="text-blue-600" />}
            enabled={configs.payment_reminders.enabled}
            onConfigClick={() => setActiveModal("payment_reminders")}
            onToggle={(enabled) => {
              const updated = { ...configs.payment_reminders, enabled };
              setConfigs({ ...configs, payment_reminders: updated });
              saveConfig("payment_reminders", updated);
            }}
          />

          {/* Scope Creep Detection */}
          <AutomationCard
            title="Scope Creep Detection"
            description="Get notified when clients request work outside the original scope"
            icon={<AlertCircle size={24} className="text-orange-600" />}
            enabled={configs.scope_creep_detection.enabled}
            onConfigClick={() => setActiveModal("scope_creep_detection")}
            onToggle={(enabled) => {
              const updated = { ...configs.scope_creep_detection, enabled };
              setConfigs({ ...configs, scope_creep_detection: updated });
              saveConfig("scope_creep_detection", updated);
            }}
          />

          {/* Project Wrap-Up */}
          <AutomationCard
            title="Project Wrap-Up"
            description="Automatically send thank you messages and request testimonials/referrals"
            icon={<CheckCircle2 size={24} className="text-green-600" />}
            enabled={configs.project_wrap_up.enabled}
            onConfigClick={() => setActiveModal("project_wrap_up")}
            onToggle={(enabled) => {
              const updated = { ...configs.project_wrap_up, enabled };
              setConfigs({ ...configs, project_wrap_up: updated });
              saveConfig("project_wrap_up", updated);
            }}
          />

          {/* Re-engagement Ping */}
          <AutomationCard
            title="Re-engagement Ping"
            description="Stay top-of-mind with past clients who haven't had active projects"
            icon={<Zap size={24} className="text-yellow-600" />}
            enabled={configs.re_engagement_ping.enabled}
            onConfigClick={() => setActiveModal("re_engagement_ping")}
            onToggle={(enabled) => {
              const updated = { ...configs.re_engagement_ping, enabled };
              setConfigs({ ...configs, re_engagement_ping: updated });
              saveConfig("re_engagement_ping", updated);
            }}
          />
        </div>

        {/* Modals */}
        {activeModal === "payment_reminders" && (
          <PaymentReminderModal
            config={configs.payment_reminders}
            onSave={(config) => {
              setConfigs({ ...configs, payment_reminders: config });
              saveConfig("payment_reminders", config);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "scope_creep_detection" && (
          <ScopeCreepModal
            config={configs.scope_creep_detection}
            onSave={(config) => {
              setConfigs({ ...configs, scope_creep_detection: config });
              saveConfig("scope_creep_detection", config);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "project_wrap_up" && (
          <ProjectWrapUpModal
            config={configs.project_wrap_up}
            onSave={(config) => {
              setConfigs({ ...configs, project_wrap_up: config });
              saveConfig("project_wrap_up", config);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "re_engagement_ping" && (
          <ReEngagementModal
            config={configs.re_engagement_ping}
            onSave={(config) => {
              setConfigs({ ...configs, re_engagement_ping: config });
              saveConfig("re_engagement_ping", config);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}
      </div>
    </div>
  );
}

interface AutomationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigClick: () => void;
}

function AutomationCard({
  title,
  description,
  icon,
  enabled,
  onToggle,
  onConfigClick,
}: AutomationCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Toggle enabled={enabled} onChange={onToggle} />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onConfigClick}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Configure
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface ModalProps {
  onClose: () => void;
  onSave: (config: any) => void;
}

function PaymentReminderModal({
  config,
  onSave,
  onClose,
}: ModalProps & { config: PaymentReminderConfig }) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <Modal onClose={onClose} title="Payment Reminder Settings">
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Escalation Schedule</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.escalationSchedule.day1}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    escalationSchedule: {
                      ...localConfig.escalationSchedule,
                      day1: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">Day 1: Gentle reminder</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.escalationSchedule.day7}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    escalationSchedule: {
                      ...localConfig.escalationSchedule,
                      day7: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">Day 7: Firm follow-up</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.escalationSchedule.day14}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    escalationSchedule: {
                      ...localConfig.escalationSchedule,
                      day14: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">Day 14: Final notice</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Late Fee (Optional)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={localConfig.lateFee?.type || "percentage"}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  lateFee: {
                    type: e.target.value as "percentage" | "flat",
                    amount: localConfig.lateFee?.amount || 0,
                  },
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
            <input
              type="number"
              value={localConfig.lateFee?.amount || 0}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  lateFee: {
                    type: localConfig.lateFee?.type || "percentage",
                    amount: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="Amount"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">
            Leave blank to disable late fees
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ScopeCreepModal({
  config,
  onSave,
  onClose,
}: ModalProps & { config: ScopeCreepConfig }) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <Modal onClose={onClose} title="Scope Creep Detection Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Sensitivity Level
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.sensitivityLevel === "strict"}
                onChange={() =>
                  setLocalConfig({ ...localConfig, sensitivityLevel: "strict" })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                Strict: Flag even small additions
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.sensitivityLevel === "moderate"}
                onChange={() =>
                  setLocalConfig({
                    ...localConfig,
                    sensitivityLevel: "moderate",
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                Moderate: Flag meaningful additions (recommended)
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.sensitivityLevel === "relaxed"}
                onChange={() =>
                  setLocalConfig({ ...localConfig, sensitivityLevel: "relaxed" })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                Relaxed: Only major new features
              </span>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={localConfig.autoDraftChangeOrder}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                autoDraftChangeOrder: e.target.checked,
              })
            }
            className="w-4 h-4"
          />
          <span className="text-gray-700">
            Auto-draft change orders for out-of-scope requests
          </span>
        </label>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProjectWrapUpModal({
  config,
  onSave,
  onClose,
}: ModalProps & { config: ProjectWrapUpConfig }) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <Modal onClose={onClose} title="Project Wrap-Up Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Delay Between Messages (days)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={localConfig.delayDays}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                delayDays: parseInt(e.target.value) || 3,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Time to wait between thank you and testimonial/referral requests
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localConfig.includeTestimonialRequest}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  includeTestimonialRequest: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-gray-700">Request testimonial</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localConfig.includeReferralAsk}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  includeReferralAsk: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-gray-700">Ask for referrals</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReEngagementModal({
  config,
  onSave,
  onClose,
}: ModalProps & { config: ReEngagementConfig }) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <Modal onClose={onClose} title="Re-engagement Ping Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Inactivity Threshold
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.inactivityThresholdDays === 30}
                onChange={() =>
                  setLocalConfig({
                    ...localConfig,
                    inactivityThresholdDays: 30,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">30 days (very active)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.inactivityThresholdDays === 60}
                onChange={() =>
                  setLocalConfig({
                    ...localConfig,
                    inactivityThresholdDays: 60,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">60 days (recommended)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                checked={localConfig.inactivityThresholdDays === 90}
                onChange={() =>
                  setLocalConfig({
                    ...localConfig,
                    inactivityThresholdDays: 90,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">90 days (quarterly)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ModalContentProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ onClose, title, children }: ModalContentProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
