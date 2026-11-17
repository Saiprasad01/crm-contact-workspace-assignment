import type { Contact, SortBy, SortDir } from '@/types';
import { formatContactDate } from '@/models/contact';
import Checkbox from '@/components/checkbox/checkbox';
import Link from 'next/link';
import styles from './contacts-table.module.scss';

interface SortButtonProps {
  label: string;
  field: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (field: SortBy, dir: SortDir) => void;
}

function SortButton({ label, field, sortBy, sortDir, onSort }: SortButtonProps) {
  const active = sortBy === field;
  const nextDir: SortDir = active && sortDir === 'asc' ? 'desc' : 'asc';
  return (
    <button
      type="button"
      className={styles.sortButton}
      onClick={() => onSort(field, nextDir)}
      aria-pressed={active}
    >
      {label}
      {active ? <span aria-hidden="true">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span> : null}
    </button>
  );
}

interface ContactsTableProps {
  contacts: Contact[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (selectAll: boolean) => void;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (field: SortBy, dir: SortDir) => void;
}

/** Desktop view (≥768px); `contacts-card-list` is the responsive fallback
 * below that — both are always in the markup, toggled purely by CSS so
 * there's no client-side layout-detection logic or hydration mismatch. */
export default function ContactsTable({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortDir,
  onSort,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">Contacts</caption>
        <thead>
          <tr>
            <th scope="col">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onChange={() => onToggleSelectAll(!allSelected)}
                label="Select all contacts on this page"
                hideLabel
              />
            </th>
            <th scope="col">
              <SortButton label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            </th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Company</th>
            <th scope="col">Tags</th>
            <th scope="col">
              <SortButton
                label="Created"
                field="createdAt"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                <Checkbox
                  id={`select-${contact.id}`}
                  checked={selectedIds.has(contact.id)}
                  onChange={() => onToggleSelect(contact.id)}
                  label={`Select ${contact.firstName} ${contact.lastName}`}
                  hideLabel
                />
              </td>
              <td>
                <Link href={`/contacts/view?id=${contact.id}`}>
                  {contact.firstName} {contact.lastName}
                </Link>
              </td>
              <td>{contact.email || '—'}</td>
              <td>{contact.phone || '—'}</td>
              <td>{contact.company || '—'}</td>
              <td>{contact.tags.map((t) => t.name).join(', ') || '—'}</td>
              <td>{formatContactDate(contact.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
