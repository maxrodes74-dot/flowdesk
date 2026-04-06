'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Check, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', cost: '~$0.04/mo' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', cost: '~$1.11/mo' },
    ],
    placeholder: 'sk-ant-...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: '~$0.15/mo' },
      { id: 'gpt-4o', name: 'GPT-4o', cost: '~$2.50/mo' },
    ],
    placeholder: 'sk-...',
  },
];

export default function SettingsPage() {
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-haiku-4-5-20251001');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [keyPrefix, setKeyPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_model) setModel(data.llm_model);
        setHasExistingKey(data.has_api_key);
        setKeyPrefix(data.api_key_prefix || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = { llm_provider: provider, llm_model: model };
      if (apiKey) body.llm_api_key = apiKey;

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (apiKey) {
        setHasExistingKey(true);
        setKeyPrefix(apiKey.slice(0, 8) + '...');
        setApiKey('');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearKey = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm_api_key: '' }),
      });
      setHasExistingKey(false);
      setKeyPrefix('');
      setApiKey('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-foreground-secondary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/garden"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Garden
      </Link>

      <h1 className="text-2xl font-semibold text-[var(--color-foreground)] mb-2">Settings</h1>
      <p className="text-sm text-[var(--color-foreground-secondary)] mb-8">
        Configure your LLM API key. Automations use your own key — Deep Garden never stores or proxies your requests.
      </p>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
          Provider
        </label>
        <div className="flex gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProvider(p.id);
                setModel(p.models[0].id);
              }}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                provider === p.id
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
          Model
        </label>
        <div className="flex gap-3">
          {selectedProvider.models.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                model === m.id
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <span className="font-medium">{m.name}</span>
              <span className="block text-xs opacity-60 mt-0.5">{m.cost}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
          API Key
        </label>
        {hasExistingKey && !apiKey ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-foreground-secondary)] font-mono">
              {keyPrefix}
            </div>
            <button
              onClick={handleClearKey}
              disabled={saving}
              className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
              title="Remove API key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider.placeholder}
              className="w-full px-4 py-2.5 pr-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] font-mono placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
        <p className="text-xs text-[var(--color-muted)] mt-2">
          Your key is stored encrypted and only used for automation runs. Deep Garden never sees your prompts or responses.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : null}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Cost Estimate */}
      <div className="mt-10 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-2">Estimated monthly cost</h3>
        <p className="text-xs text-[var(--color-foreground-secondary)]">
          With all automations enabled and ~5 notes/day, your estimated LLM cost is{' '}
          <span className="text-[var(--color-accent)] font-medium">
            {selectedProvider.models.find((m) => m.id === model)?.cost || '~$0.15/mo'}
          </span>{' '}
          paid directly to {selectedProvider.name}. Deep Garden charges $0 for LLM usage.
        </p>
      </div>
    </div>
  );
}
