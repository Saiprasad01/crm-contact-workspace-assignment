import QueryState from '@/components/query-state/query-state';
import { ACTIVITY_LABELS, CONTACT_FIELD_LABELS } from '@/constants/activity.constants';
import { formatContactDate } from '@/models/contact';
import type { ContactFormValues, RawActivityItem } from '@/types';
import styles from './activity-feed.module.scss';

function describeActivity(item: RawActivityItem): string {
  const label = ACTIVITY_LABELS[item.type] || item.type;
  const changedFields = item.metadata?.changedFields;
  if (item.type === 'CONTACT_UPDATED' && Array.isArray(changedFields) && changedFields.length) {
    const fields = (changedFields as Array<keyof ContactFormValues>)
      .map((f) => CONTACT_FIELD_LABELS[f] || f)
      .join(', ');
    return `${label}: ${fields}`;
  }
  const tag = item.metadata?.tag;
  if ((item.type === 'TAG_ADDED' || item.type === 'TAG_REMOVED') && tag) {
    return `${label}: ${tag}`;
  }
  return label;
}

interface ActivityFeedProps {
  items: RawActivityItem[];
  loading: boolean;
  error?: string | null;
}

export default function ActivityFeed({ items, loading, error }: ActivityFeedProps) {
  return (
    <QueryState
      loading={loading}
      error={error}
      isEmpty={items.length === 0}
      emptyLabel="No activity yet."
    >
      <ul className={styles.list} aria-label="Recent activity">
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.description}>{describeActivity(item)}</span>
            <time className="text-body-s" dateTime={item.createdAt}>
              {formatContactDate(item.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </QueryState>
  );
}
