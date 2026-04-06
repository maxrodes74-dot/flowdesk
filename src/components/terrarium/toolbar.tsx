'use client';

import React from 'react';
import { Plus, Search, LogOut, Settings, List, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import type { SidebarPanel } from './left-sidebar';

interface ToolbarProps {
  onSeed: () => void;
  onSearch: () => void;
  activePanel: SidebarPanel;
  onSetPanel: (panel: SidebarPanel) => void;
  noteCount: number;
}

export default function Toolbar({ onSeed, onSearch, activePanel, onSetPanel, noteCount }: ToolbarProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const sidebarOpen = activePanel !== null;

  const handleToggleNotes = () => {
    onSetPanel(activePanel === 'notes' ? null : 'notes');
  };

  const handleToggleAutomations = () => {
    onSetPanel(activePanel === 'automations' ? null : 'automations');
  };

  return (
    <>
      {/* Top-left: Brand + panel toggles — shifts right when sidebar is open */}
      <div
        className="absolute top-4 z-40 flex items-center gap-2"
        style={{
          left: sidebarOpen ? '336px' : '16px',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm border border-[var(--color-border)]">
          <span className="text-lg">🌿</span>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Deep Garden
          </span>
          <span className="text-xs text-[var(--color-foreground-secondary)] ml-1">
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </span>
        </div>
        <button
          onClick={handleToggleNotes}
          className={`p-2.5 rounded-lg backdrop-blur-sm border transition-colors ${
            activePanel === 'notes'
              ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]'
              : 'bg-[var(--color-surface)]/80 border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
          }`}
          title="Notes"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggleAutomations}
          className={`p-2.5 rounded-lg backdrop-blur-sm border transition-colors ${
            activePanel === 'automations'
              ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/40 text-[var(--color-accent)]'
              : 'bg-[var(--color-surface)]/80 border-[var(--color-border)] text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]'
          }`}
          title="Automations"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Top-right: Actions */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={onSearch}
          className="p-2.5 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm
            border border-[var(--color-border)]
            text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]
            transition-colors"
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push('/garden/settings')}
          className="p-2.5 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm
            border border-[var(--color-border)]
            text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]
            transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => signOut()}
          className="p-2.5 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm
            border border-[var(--color-border)]
            text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]
            transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-left: Seed button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button
          onClick={onSeed}
          className="
            flex items-center gap-2
            px-4 py-2.5
            rounded-full
            bg-[var(--color-accent)]
            text-[var(--color-background)]
            font-semibold text-sm
            shadow-lg shadow-[var(--color-accent)]/20
            hover:shadow-xl hover:shadow-[var(--color-accent)]/30
            hover:scale-105
            active:scale-95
            transition-all
          "
        >
          <Plus className="w-4 h-4" />
          Seed
        </button>
      </div>
    </>
  );
}
