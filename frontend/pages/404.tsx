import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main id="main-content" style={{ padding: 40, textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p>
        <Link href="/">Back to contacts</Link>
      </p>
    </main>
  );
}
