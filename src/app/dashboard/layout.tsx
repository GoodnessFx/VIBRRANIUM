import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 p-6 flex flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-black font-black text-sm">V</span>
          </div>
          <span className="font-bold tracking-tighter">VIBRANIUM</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium">Overview</Link>
          <Link href="/dashboard/protocols" className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors">Protocols</Link>
          <Link href="/dashboard/incidents" className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors">Incidents</Link>
          <Link href="/dashboard/settings" className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors">Settings</Link>
        </nav>

        <div className="flex items-center gap-3 px-4 py-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm font-medium text-zinc-400">Account</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
