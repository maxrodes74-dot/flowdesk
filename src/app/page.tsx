'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (session) {
          router.push('/garden');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Leaf className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
          <p className="text-sm text-[var(--color-foreground-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-background)] to-[var(--color-surface)] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Leaf className="w-8 h-8 text-[var(--color-accent)]" />
          <h1 className="text-5xl font-bold text-[var(--color-foreground)]">
            Deep Garden
          </h1>
        </div>
        <p className="text-xl text-[var(--color-foreground-secondary)] mt-4">
          Your notes are alive
        </p>
      </div>

      {/* Tagline */}
      <p className="text-lg text-[var(--color-foreground-secondary)] max-w-2xl text-center mb-12">
        A cloud-native knowledge graph where your notes live as creatures in a
        2D terrarium. They auto-link, auto-tag, synthesize, and organize themselves.
      </p>

      {/* CTA Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {isAuthenticated ? (
          <Link
            href="/garden"
            className="
              px-8
              py-3
              rounded
              bg-[var(--color-accent)]
              text-[var(--color-background)]
              font-semibold
              hover:opacity-90
              transition-opacity
              flex
              items-center
              gap-2
            "
          >
            Enter Garden
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="
                px-8
                py-3
                rounded
                bg-[var(--color-accent)]
                text-[var(--color-background)]
                font-semibold
                hover:opacity-90
                transition-opacity
                flex
                items-center
                gap-2
              "
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signup"
              className="
                px-8
                py-3
                rounded
                border-2
                border-[var(--color-accent)]
                text-[var(--color-accent)]
                font-semibold
                hover:bg-[var(--color-accent)]
                hover:text-[var(--color-background)]
                transition-colors
              "
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Features */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--color-accent)] font-bold">1</span>
          </div>
          <h3 className="font-semibold text-[var(--color-foreground)] mb-2">
            Write Freely
          </h3>
          <p className="text-sm text-[var(--color-foreground-secondary)]">
            Capture your thoughts without structure. Your ideas matter.
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--color-accent)] font-bold">2</span>
          </div>
          <h3 className="font-semibold text-[var(--color-foreground)] mb-2">
            Connect Ideas
          </h3>
          <p className="text-sm text-[var(--color-foreground-secondary)]">
            Link notes together and watch patterns emerge naturally.
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--color-accent)] font-bold">3</span>
          </div>
          <h3 className="font-semibold text-[var(--color-foreground)] mb-2">
            Discover Knowledge
          </h3>
          <p className="text-sm text-[var(--color-foreground-secondary)]">
            Let AI help organize and surface connections you didn&apos;t see.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 text-center text-sm text-[var(--color-foreground-secondary)]">
        <p>Built with AI, for thinkers.</p>
      </div>
    </div>
  );
}
