import Checkbox from '@/components/checkbox/checkbox';
import { formatContactDate } from '@/models/contact';
import type { Contact } from '@/types';
import Link from 'next/link';
import styles from './contacts-card-list.module.scss';

interface ContactsCardListProps {
  contacts: Contact[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

/** Mobile fallback (<768px) for `contacts-table` — a wide table doesn't fit a
 * phone screen, so each contact becomes a card instead. */
export default function ContactsCardList({ contacts, selectedIds, onToggleSelect }: ContactsCardListProps) {
  return (
    <ul className={styles.list}>
      {contacts.map((contact) => (
        <li key={contact.id} className={styles.card}>
          <div className={styles.header}>
            <Checkbox
              id={`select-card-${contact.id}`}
              checked={selectedIds.has(contact.id)}
              onChange={() => onToggleSelect(contact.id)}
              label={`Select ${contact.firstName} ${contact.lastName}`}
              hideLabel
            />
            <Link href={`/contacts/view?id=${contact.id}`} className={styles.name}>
              {contact.firstName} {contact.lastName}
            </Link>
          </div>
          <dl className={styles.details}>
            <div>
              <dt>Email</dt>
              <dd>{contact.email || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{contact.phone || '—'}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{contact.company || '—'}</dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd>{contact.tags.map((t) => t.name).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatContactDate(contact.createdAt)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
