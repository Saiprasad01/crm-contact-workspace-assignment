import { closeModal, openModal } from '@/components/modal/modal';
import type { FormEvent } from 'react';
import { useState } from 'react';
import styles from './bulk-action-bar.module.scss';

interface BulkTagConfirmProps {
  count: number;
  tagName: string;
  onConfirm: () => void;
}

function BulkTagConfirm({ count, tagName, onConfirm }: BulkTagConfirmProps) {
  return (
    <div>
      <h2 className={styles.confirmTitle}>
        Assign tag to {count} contact{count === 1 ? '' : 's'}?
      </h2>
      <p className="text-body-s">
        This adds the tag <strong>{tagName}</strong> to every selected contact that doesn&apos;t
        already have it.
      </p>
      <div className={styles.confirmActions}>
        <button type="button" className="btn btn--secondary" onClick={closeModal}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            onConfirm();
            closeModal();
          }}
        >
          Assign tag
        </button>
      </div>
    </div>
  );
}

interface BulkActionBarProps {
  selectedCount: number;
  allTagNames?: string[];
  onAssignTag: (tagName: string) => void;
  pending?: boolean;
}

/** Appears once at least one row checkbox is selected. Assigning a tag is
 * confirmed through the global modal first — a mass-tagging action shouldn't
 * be a single accidental click. */
export default function BulkActionBar({
  selectedCount,
  allTagNames = [],
  onAssignTag,
  pending,
}: BulkActionBarProps) {
  const [tagName, setTagName] = useState('');

  if (selectedCount === 0) return null;

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = tagName.trim();
    if (!trimmed) return;

    openModal(
      <BulkTagConfirm
        count={selectedCount}
        tagName={trimmed}
        onConfirm={() => {
          onAssignTag(trimmed);
          setTagName('');
        }}
      />,
      undefined,
      `Assign tag to ${selectedCount} contacts`
    );
  };

  return (
    <form className={styles.bar} onSubmit={handleAssign} aria-label="Bulk tag assignment">
      <span className={styles.count}>{selectedCount} selected</span>
      <label htmlFor="bulk-tag-input" className="visually-hidden">
        Tag name
      </label>
      <input
        id="bulk-tag-input"
        list="existing-tags"
        className={styles.input}
        value={tagName}
        onChange={(event) => setTagName(event.target.value)}
        placeholder="Tag name…"
        disabled={pending}
      />
      <datalist id="existing-tags">
        {allTagNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <button
        type="submit"
        className="btn btn--primary btn--small"
        disabled={pending || !tagName.trim()}
      >
        Assign tag to selection
      </button>
    </form>
  );
}
