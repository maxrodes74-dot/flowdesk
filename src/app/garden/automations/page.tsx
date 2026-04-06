'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Play, Pause, Pencil, Trash2, Loader2, Check, X,
  ChevronDown, ChevronRight, Clock, Zap, AlertCircle,
  Link as LinkIcon, Tags, GitBranch, Sparkles, Telescope, Maximize2,
  CircleDashed, Leaf, Newspaper, Unlink,
} from 'lucide-react';
import {
  AUTOMATION_TEMPLATES,
  SCHEDULE_OPTIONS,
  CATEGORY_META,
  type AutomationTemplate,
} from '@/lib/automation-templates';

type Automation = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  schedule: string;
  is_enabled: boolean;
  is_preset: boolean;
  preset_key: string | null;
  last_run_at: string | null;
  last_run_status: 'success' | 'error' | 'running' | null;
  last_run_result: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon, Tags, GitBranch, Sparkles, Telescope, Maximize2,
  CircleDashed, Leaf, Newspaper, Unlink,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ScheduleBadge({ schedule }: { schedule: string }) {
  const opt = SCHEDULE_OPTIONS.find((s) => s.value === schedule);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--color-surface-secondary)] text-[var(--color-foreground-secondary)]">
      <Clock className="w-3 h-3" />
      {opt?.label || schedule}
    </span>
  );
}

function StatusDot({ status }: { status: string | null }) {
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />;
  if (status === 'success') return <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />;
  if (status === 'error') return <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />;
  return <div className="w-2 h-2 rounded-full bg-[var(--color-muted)]" />;
}

// === AUTOMATION CARD ===
function AutomationCard({
  automation,
  onRun,
  onToggle,
  onEdit,
  onDelete,
}: {
  automation: Automation;
  onRun: (id: string, customInput?: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(automation.last_run_status === 'running');
  const [customInput, setCustomInput] = useState('');
  const [showRuns, setShowRuns] = useState(false);
  const [runs, setRuns] = useState<Array<{ id: string; status: string; result: string | null; started_at: string; duration_ms: number | null; tokens_used: number }>>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const needsInput = automation.prompt.includes('{{custom_input}}');

  const handleRun = async () => {
    setRunning(true);
    await onRun(automation.id, needsInput ? customInput : undefined);
    setRunning(false);
  };

  const fetchRuns = async () => {
    const res = await fetch(`/api/automations/${automation.id}/runs`);
    if (res.ok) setRuns(await res.json());
  };

  // Find matching template for icon
  const template = AUTOMATION_TEMPLATES.find((t) => t.key === automation.preset_key);
  const IconComponent = template ? ICON_MAP[template.icon] : Zap;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: template
              ? CATEGORY_META[template.category].color + '20'
              : 'var(--color-surface-secondary)',
          }}
        >
          {IconComponent && (
            <IconComponent className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--color-foreground)] truncate">
              {automation.name}
            </span>
            <StatusDot status={automation.last_run_status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <ScheduleBadge schedule={automation.schedule} />
            {automation.last_run_at && (
              <span className="text-xs text-[var(--color-muted)]">
                Last: {timeAgo(automation.last_run_at)}
              </span>
            )}
            {automation.run_count > 0 && (
              <span className="text-xs text-[var(--color-muted)]">
                {automation.run_count} run{automation.run_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRun}
            disabled={running}
            className="p-2 rounded-lg text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-50"
            title="Run now"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onToggle(automation.id, !automation.is_enabled)}
            className={`p-2 rounded-lg transition-colors ${
              automation.is_enabled
                ? 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-secondary)]'
            }`}
            title={automation.is_enabled ? 'Disable' : 'Enable'}
          >
            {automation.is_enabled ? <Check className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(automation)}
            className="p-2 rounded-lg text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(automation.id); setConfirmDelete(false); }}
                className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-danger)] text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded text-xs text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-secondary)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg text-[var(--color-foreground-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)]">
          {automation.description && (
            <p className="text-xs text-[var(--color-foreground-secondary)] mt-3 mb-3">
              {automation.description}
            </p>
          )}

          {/* Custom input for automations that use {{custom_input}} */}
          {needsInput && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-[var(--color-foreground-secondary)] mb-1">
                Input (used as {'{{custom_input}}'} in prompt)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder='e.g. "lizards", "React Server Components", "history of jazz"'
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
                  onKeyDown={(e) => { if (e.key === 'Enter' && customInput.trim()) handleRun(); }}
                />
                <button
                  onClick={handleRun}
                  disabled={running || !customInput.trim()}
                  className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] text-sm font-medium disabled:opacity-50"
                >
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run'}
                </button>
              </div>
            </div>
          )}

          {/* Prompt preview */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[var(--color-foreground-secondary)]">Prompt</span>
            </div>
            <pre className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-foreground-secondary)] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {automation.prompt.length > 600 ? automation.prompt.slice(0, 600) + '...' : automation.prompt}
            </pre>
          </div>

          {/* Last run result */}
          {automation.last_run_result && (
            <div
              className={`p-3 rounded-lg text-xs font-mono mb-3 ${
                automation.last_run_status === 'error'
                  ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                  : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              }`}
            >
              <span className="font-semibold">Last result: </span>
              {automation.last_run_result}
            </div>
          )}

          {/* Run history toggle */}
          <button
            onClick={() => { setShowRuns(!showRuns); if (!showRuns) fetchRuns(); }}
            className="text-xs text-[var(--color-foreground-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {showRuns ? 'Hide run history' : 'Show run history'}
          </button>
          {showRuns && (
            <div className="mt-2 space-y-1.5">
              {runs.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No runs yet</p>
              ) : (
                runs.slice(0, 10).map((run) => (
                  <div key={run.id} className="flex items-center gap-2 text-xs">
                    <StatusDot status={run.status} />
                    <span className="text-[var(--color-foreground-secondary)]">{timeAgo(run.started_at)}</span>
                    {run.duration_ms && (
                      <span className="text-[var(--color-muted)]">{(run.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                    {run.tokens_used > 0 && (
                      <span className="text-[var(--color-muted)]">{run.tokens_used} tokens</span>
                    )}
                    {run.result && (
                      <span className="text-[var(--color-foreground-secondary)] truncate flex-1">{run.result}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === EDITOR MODAL ===
function AutomationEditor({
  automation,
  onSave,
  onClose,
}: {
  automation: Partial<Automation> | null;
  onSave: (data: {
    name: string;
    description: string;
    prompt: string;
    schedule: string;
    preset_key?: string;
    is_preset?: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(automation?.name || '');
  const [description, setDescription] = useState(automation?.description || '');
  const [prompt, setPrompt] = useState(automation?.prompt || '');
  const [schedule, setSchedule] = useState(automation?.schedule || 'manual');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim(),
      prompt: prompt.trim(),
      schedule,
      preset_key: automation?.preset_key || undefined,
      is_preset: automation?.is_preset || false,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {automation?.id ? 'Edit Automation' : 'New Automation'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-secondary)]">
            <X className="w-5 h-5 text-[var(--color-foreground-secondary)]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Link Cleanup"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this automation do?"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Schedule</label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSchedule(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    schedule === opt.value
                      ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
                  }`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
              Prompt
              <span className="font-normal text-[var(--color-foreground-secondary)] ml-2">
                Use {'{{notes}}'}, {'{{note_titles}}'}, {'{{existing_tags}}'}, {'{{links}}'}, {'{{graph_summary}}'}, {'{{custom_input}}'} as variables
              </span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] font-mono placeholder:text-[var(--color-muted)] resize-y"
              placeholder="Write your prompt here. Tell the AI what to do with your notes..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {automation?.id ? 'Save Changes' : 'Create Automation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === TEMPLATE CARD ===
function TemplateCard({
  template,
  onAdd,
}: {
  template: AutomationTemplate;
  onAdd: (template: AutomationTemplate) => void;
}) {
  const IconComponent = ICON_MAP[template.icon] || Zap;
  const catMeta = CATEGORY_META[template.category];

  return (
    <button
      onClick={() => onAdd(template)}
      className="text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: catMeta.color + '20' }}
        >
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
              {template.name}
            </span>
            {template.tier === 'pro' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)]">
                PRO
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-foreground-secondary)] mt-1 line-clamp-2">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: catMeta.color + '15', color: catMeta.color }}
            >
              {catMeta.label}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              {SCHEDULE_OPTIONS.find((s) => s.value === template.schedule)?.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// === MAIN PAGE ===
export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Automation> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fetchAutomations = useCallback(async () => {
    const res = await fetch('/api/automations');
    if (res.ok) {
      const data = await res.json();
      setAutomations(data);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchAutomations(),
      fetch('/api/settings').then((r) => r.json()).then((d) => setHasApiKey(d.has_api_key)),
    ]).finally(() => setLoading(false));
  }, [fetchAutomations]);

  const handleRun = async (id: string, customInput?: string) => {
    const body = customInput ? JSON.stringify({ customInput }) : undefined;
    const res = await fetch(`/api/automations/${id}/run`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body,
    });
    if (res.ok) {
      await fetchAutomations();
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: enabled }),
    });
    await fetchAutomations();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/automations/${id}`, { method: 'DELETE' });
    await fetchAutomations();
  };

  const handleSave = async (data: {
    name: string;
    description: string;
    prompt: string;
    schedule: string;
    preset_key?: string;
    is_preset?: boolean;
  }) => {
    if (editing?.id) {
      await fetch(`/api/automations/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    setShowEditor(false);
    setEditing(null);
    await fetchAutomations();
  };

  const handleAddTemplate = async (template: AutomationTemplate) => {
    await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        prompt: template.prompt,
        schedule: template.schedule,
        is_preset: true,
        preset_key: template.key,
      }),
    });
    setShowTemplates(false);
    await fetchAutomations();
  };

  const handleNewCustom = () => {
    setEditing(null);
    setShowEditor(true);
  };

  const handleEdit = (automation: Automation) => {
    setEditing(automation);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-foreground-secondary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/garden"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Garden
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Automations</h1>
          <p className="text-sm text-[var(--color-foreground-secondary)] mt-1">
            Scheduled tasks that run LLM prompts against your knowledge graph. Uses your own API key.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={handleNewCustom}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Custom
          </button>
        </div>
      </div>

      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-accent-secondary)]/30 bg-[var(--color-accent-secondary)]/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-accent-secondary)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">No API key configured</p>
            <p className="text-xs text-[var(--color-foreground-secondary)] mt-0.5">
              Automations need your own LLM API key to run.{' '}
              <Link href="/garden/settings" className="text-[var(--color-accent)] hover:underline">
                Add one in Settings
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Template Library */}
      {showTemplates && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--color-foreground)]">Prebuilt Templates</h2>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-xs text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AUTOMATION_TEMPLATES.map((template) => {
              const alreadyAdded = automations.some((a) => a.preset_key === template.key);
              return alreadyAdded ? null : (
                <TemplateCard key={template.key} template={template} onAdd={handleAddTemplate} />
              );
            })}
          </div>
          {AUTOMATION_TEMPLATES.every((t) => automations.some((a) => a.preset_key === t.key)) && (
            <p className="text-sm text-[var(--color-muted)] text-center py-4">
              All templates added. Create a custom automation for anything else.
            </p>
          )}
        </div>
      )}

      {/* Automation List */}
      {automations.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">No automations yet</h3>
          <p className="text-sm text-[var(--color-foreground-secondary)] max-w-md mx-auto mb-6">
            Add a prebuilt template or create a custom one. Automations run LLM prompts against your
            notes on a schedule — auto-linking, tagging, research, cleanup, whatever you want.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Browse Templates
            </button>
            <button
              onClick={handleNewCustom}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Write Custom Prompt
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <AutomationCard
              key={a.id}
              automation={a}
              onRun={handleRun}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <AutomationEditor
          automation={editing}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
