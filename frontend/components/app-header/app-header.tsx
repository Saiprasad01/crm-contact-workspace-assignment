import Link from 'next/link';
import styles from './app-header.module.scss';

/** Persistent site header shown on every page — the app's one `<h1>`, so
 * page-level headings (e.g. "Contacts", a contact's name) stay `<h2>` and
 * the heading hierarchy stays correct for screen-reader navigation. */
export default function AppHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.link}>
        <h1 className={styles.title}>CRM Contact Workspace</h1>
      </Link>
    </header>
  );
}
