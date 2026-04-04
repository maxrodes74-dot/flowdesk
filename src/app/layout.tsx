import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { PostHogProvider } from '@/components/posthog-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knowledge Terrarium — AI-Native Knowledge Graph',
  description:
    'A beautiful self-organizing knowledge garden. Build your personal knowledge graph with AI-powered linking, graph visualization, and semantic search.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-full flex flex-col bg-[#0a0f0d] text-[#e8ede5]">
        <PostHogProvider>
          <Providers>{children}</Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}
