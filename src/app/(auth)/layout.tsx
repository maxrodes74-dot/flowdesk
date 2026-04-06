import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center mb-8"
        >
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            Terrarium
          </span>
        </Link>

        <div className="rounded-xl p-8 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
