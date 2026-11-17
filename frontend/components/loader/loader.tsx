import styles from './loader.module.scss';

interface LoaderProps {
  label?: string;
}

export default function Loader({ label = 'Loading…' }: LoaderProps) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
