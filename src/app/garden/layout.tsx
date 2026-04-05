import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/garden/sidebar';
import { getNotes } from '@/lib/notes';

export const metadata = {
  title: 'Garden - Knowledge Terrarium',
  description: 'Your personal knowledge graph',
};

export default async function GardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let notes: Awaited<ReturnType<typeof getNotes>>['notes'] = [];
  try {
    const result = await getNotes(user.id);
    notes = result.notes;
  } catch (error) {
    console.error('Failed to load notes:', error);
  }

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar
        notes={notes}
        onNewNote={async () => {
          'use server';
          // This will be handled client-side with navigation
        }}
        onSelectNote={async (id: string) => {
          'use server';
          // This will be handled client-side with navigation
        }}
        onSearch={async (noteId: string) => {
          'use server';
          // This will be handled client-side with navigation
        }}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
