'use client';

import React from 'react';
import { Plus, Search, LogOut, Zap, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface ToolbarProps {
  onSeed: () => void;
  onSearch: () => void;
  noteCount: number;
}

export default function Toolbar({ onSeed, onSearch, noteCount }: ToolbarProps) {
  const { signOut } = useAuth();

  return (
    <>
      {/* Top-left: Brand */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm border border-[var(--color-border)]">
          <span className="text-lg">🌿</span>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Deep Garden
          </span>
          <span className="text-xs text-[var(--color-foreground-secondary)] ml-1">
            {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>

      {/* Top-right: Nav + Settings */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Link
          href="/garden/automations"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm
            border border-[var(--color-border)]
            text-[var(--color-foreground-secondary)] hover:text-[var(--color-accent)]
            text-xs font-medium transition-colors"
          title="Automations"
        >
          <Zap className="w-4 h-4" />
          Automations
        </Link>
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
        <Link
          href="/garden/settings"
          className="p-2.5 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-sm
            border border-[var(--color-border)]
            text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)]
            transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
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
