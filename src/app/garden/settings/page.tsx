'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { VALID_MODELS } from '@/lib/models';

type Provider = 'anthropic' | 'openai';

const MODELS: Record<Provider, string[]> = VALID_MODELS as Record<Provider, string[]>;

const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
};

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const [displayName, setDisplayName] = useState('');
  const [tier, setTier] = useState('free');
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.display_name || '');
          setTier(data.tier || 'free');
          if (data.llm_provider) setProvider(data.llm_provider);
          setApiKeySet(data.llm_api_key_set || false);
          if (data.llm_model) setModel(data.llm_model);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Set default model when provider changes
  useEffect(() => {
    if (!model || !MODELS[provider].includes(model)) {
      setModel(MODELS[provider][0]);
    }
  }, [provider, model]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const body: Record<string, unknown> = {
        display_name: displayName,
        llm_provider: provider,
        llm_model: model,
      };

      // Only send API key if user entered a new one
      if (apiKey.trim()) {
        body.llm_api_key = apiKey.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setApiKeySet(data.llm_api_key_set);
        setApiKey(''); // Clear the input after saving
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, provider, model, apiKey]);

  const handleClearKey = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm_api_key: '' }),
      });
      if (res.ok) {
        setApiKeySet(false);
        setApiKey('');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Failed to clear key:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-foreground-secondary)]">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/garden')}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--color-foreground-secondary)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Settings</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-foreground-secondary)] capitalize">
            {tier}
          </span>
        </div>

        {/* Display Name */}
        <section className="mb-8">
          <label className="block text-sm font-semibold text-[var(--color-foreground)] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </section>

        {/* BYOT Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              LLM API Key (BYOT)
            </h2>
          </div>
          <p className="text-xs text-[var(--color-foreground-secondary)] mb-4">
            Deep Garden automations like auto-tag, synthesis, and foraging use your own LLM key.
            Embedding-based features (auto-link, clusters) work without a key.
          </p>

          {/* Provider Select */}
          <label className="block text-xs font-medium text-[var(--color-foreground-secondary)] mb-1">
            Provider
          </label>
          <div className="flex gap-2 mb-4">
            {(Object.keys(MODELS) as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  provider === p
                    ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Model Select */}
          <label className="block text-xs font-medium text-[var(--color-foreground-secondary)] mb-1">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm outline-none focus:border-[var(--color-accent)] mb-4"
          >
            {MODELS[provider].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* API Key Input */}
          <label className="block text-xs font-medium text-[var(--color-foreground-secondary)] mb-1">
            API Key
          </label>
          <div className="relative mb-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKeySet ? '••••••••••••••••••• (key saved)' : 'sk-... or sk-ant-...'}
              className="w-full px-3 py-2 pr-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] text-sm font-mono outline-none focus:border-[var(--color-accent)]"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-surface-secondary)]"
              type="button"
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              )}
            </button>
          </div>

          {apiKeySet && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                <Check className="w-3 h-3" />
                API key saved
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    setTestStatus('testing');
                    try {
                      const res = await fetch('/api/settings/test', { method: 'POST' });
                      const data = await res.json();
                      setTestStatus(res.ok ? 'ok' : 'fail');
                      setTestMessage(res.ok ? `Connected to ${data.provider}` : data.error || 'Connection failed');
                    } catch {
                      setTestStatus('fail');
                      setTestMessage('Network error');
                    }
                    setTimeout(() => setTestStatus('idle'), 5000);
                  }}
                  disabled={testStatus === 'testing'}
                  className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleClearKey}
                  className="text-xs text-[var(--color-danger)] hover:underline"
                >
                  Remove key
                </button>
              </div>
            </div>
          )}

          {testStatus === 'ok' && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)] mb-4">
              <Check className="w-3 h-3" /> {testMessage}
            </div>
          )}
          {testStatus === 'fail' && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-danger)] mb-4">
              <AlertCircle className="w-3 h-3" /> {testMessage}
            </div>
          )}

          <p className="text-[10px] text-[var(--color-muted)] mb-4">
            Your key is stored encrypted and only used server-side for automations you trigger.
            Deep Garden never stores or logs your API responses.
          </p>
        </section>

        {/* Estimated Costs */}
        <section className="mb-8 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="text-xs font-semibold text-[var(--color-foreground-secondary)] mb-2">
            Estimated Monthly LLM Cost (yours, not ours)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[var(--color-foreground-secondary)]">Active use (5 notes/day)</div>
              <div className="text-[var(--color-foreground)] font-medium">
                {provider === 'anthropic' ? '~$1.11/mo' : '~$0.15/mo'}
              </div>
            </div>
            <div>
              <div className="text-[var(--color-foreground-secondary)]">Casual (1-2 notes/day)</div>
              <div className="text-[var(--color-foreground)] font-medium">
                {provider === 'anthropic' ? '~$0.33/mo' : '~$0.04/mo'}
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-background)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}

          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
              <AlertCircle className="w-3 h-3" /> Failed to save
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
