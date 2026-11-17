import { closeModal } from '@/components/modal/modal';
import { diffContactFields } from '@/models/contact';
import type { Contact, ContactFormValues } from '@/types';
import styles from './conflict-modal.module.scss';

interface ConflictModalProps {
  draft: ContactFormValues;
  latest: Contact;
  onReloadLatest: (latest: Contact) => void;
  onOverwriteAnyway: (draft: ContactFormValues, latestVersion: number) => void;
}

/**
 * The brief's "reasonable way to detect or prevent accidental overwrites":
 * a side-by-side diff with two explicit choices, not a full merge tool or
 * distributed lock (neither is required — see PROJECT_IMPLEMENTATION_PLAN.md
 * Assumption 4).
 */
export default function ConflictModal({ draft, latest, onReloadLatest, onOverwriteAnyway }: ConflictModalProps) {
  const diffs = diffContactFields(draft, latest);

  return (
    <div>
      <h2 className={styles.title}>This contact was updated by someone else</h2>
      <p className="text-body-s">
        {latest.firstName} {latest.lastName} changed after you loaded this page. Review the
        differences below, then choose how to proceed.
      </p>

      {diffs.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Your draft</th>
              <th scope="col">Latest on server</th>
            </tr>
          </thead>
          <tbody>
            {diffs.map((d) => (
              <tr key={d.field}>
                <th scope="row">{d.label}</th>
                <td>{d.draftValue}</td>
                <td>{d.latestValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Only unrelated fields changed (e.g. tags) — your edit can still be applied safely.</p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            onReloadLatest(latest);
            closeModal();
          }}
        >
          Reload latest
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            onOverwriteAnyway(draft, latest.version);
            closeModal();
          }}
        >
          Overwrite anyway
        </button>
      </div>
    </div>
  );
}
