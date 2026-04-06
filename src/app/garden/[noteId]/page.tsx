'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Legacy route — redirects to the terrarium view.
 * Notes are now opened as panels within the garden page.
 */
export default function NoteRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to garden — the terrarium handles note selection
    router.replace('/garden');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center text-[var(--color-foreground-secondary)]">
      Redirecting...
    </div>
  );
}
