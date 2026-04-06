import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Deep Garden — Your Living Knowledge Graph',
  description: 'Your notes are alive',
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

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] overflow-y-auto">
      {children}
    </div>
  );
}
