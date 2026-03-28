import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <Link
          href="/"
          className="flex items-center justify-center mb-8 group"
        >
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ScopePad
          </div>
        </Link>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200/50">
          {children}
        </div>
      </div>
    </div>
  );
}
