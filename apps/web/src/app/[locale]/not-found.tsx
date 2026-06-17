import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">This page doesn’t exist or has moved.</p>
      <Link href="/" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground">
        Back home
      </Link>
    </main>
  );
}
