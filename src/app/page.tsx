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
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (session) {
        router.push('/garden');
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return null; // Loading
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg)] to-[var(--surface)] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Leaf className="w-8 h-8 text-[var(--accent)]" />
          <h1 className="text-5xl font-bold text-[var(--text)]">
            Knowledge Terrarium
          </h1>
        </div>
        <p className="text-xl text-[var(--text-secondary)] mt-4">
          A Roomba for your knowledge
        </p>
      </div>

      {/* Tagline */}
      <p className="text-lg text-[var(--text-secondary)] max-w-2xl text-center mb-12">
        Build a self-organizing knowledge graph. Connect your thoughts, discover
        patterns, and watch your ideas grow.
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
              bg-[var(--accent)]
              text-[var(--bg)]
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
                bg-[var(--accent)]
                text-[var(--bg)]
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
                border-[var(--accent)]
                text-[var(--accent)]
                font-semibold
                hover:bg-[var(--accent)]
                hover:text-[var(--bg)]
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
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] bg-opacity-10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--accent)] font-bold">1</span>
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-2">
            Write Freely
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Capture your thoughts without structure. Your ideas matter.
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] bg-opacity-10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--accent)] font-bold">2</span>
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-2">
            Connect Ideas
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Link notes together and watch patterns emerge naturally.
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] bg-opacity-10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[var(--accent)] font-bold">3</span>
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-2">
            Discover Knowledge
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Let AI help organize and surface connections you didn't see.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 text-center text-sm text-[var(--text-secondary)]">
        <p>Built with AI, for thinkers.</p>
      </div>
    </div>
  );
}
