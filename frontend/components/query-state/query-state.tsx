import Loader from '@/components/loader/loader';
import type { ReactNode } from 'react';
import styles from './query-state.module.scss';

interface QueryStateProps {
  loading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyLabel?: string;
  loadingLabel?: string;
  children?: ReactNode;
}

/** Single place handling the loading/empty/error states both the contacts
 * list and the activity feed need, so all four required UI states (loading,
 * empty, error, success) stay consistent without a bespoke solution per screen. */
export default function QueryState({
  loading,
  error,
  isEmpty,
  emptyLabel = 'No results found.',
  loadingLabel,
  children,
}: QueryStateProps) {
  if (loading) return <Loader label={loadingLabel} />;

  if (error) {
    return (
      <div className={styles.state} role="alert">
        {error}
      </div>
    );
  }

  if (isEmpty) {
    return <div className={styles.state}>{emptyLabel}</div>;
  }

  return <>{children}</>;
}
