import type { Metadata } from "next";
import { AppProvider } from "@/components/providers";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowDesk — AI-Powered Client Portal for Freelancers",
  description:
    "Send professional proposals in 90 seconds. Get paid on time, every time. AI proposals, client portals, and smart invoicing for freelancers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <AppProvider>{children}</AppProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
