import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { PostHogProvider } from '@/components/posthog-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deep Garden — Your Notes Are Alive',
  description:
    'A cloud-native knowledge graph where your notes live as creatures in a 2D terrarium. They auto-link, auto-tag, synthesize, and organize themselves.',
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
