import Link from 'next/link';
import { Mic } from 'lucide-react';

/** Dashboard placeholder (Phase 3 fills with real stats). Entry point to a conversation. */
export default function DashboardPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-3 text-muted-foreground">
        Your conversations, talk time, remaining minutes, mood score, and weekly summary will appear
        here.
      </p>
      <Link
        href="/conversation"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
      >
        <Mic className="h-5 w-5" /> Start a conversation
      </Link>
    </main>
  );
}
