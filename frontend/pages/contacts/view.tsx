import ActivityFeed from '@/components/activity-feed/activity-feed';
import { showToast } from '@/components/app-toast/app-toast';
import ConflictModal from '@/components/conflict-modal/conflict-modal';
import ContactForm from '@/components/contact-form/contact-form';
import { openModal } from '@/components/modal/modal';
import QueryState from '@/components/query-state/query-state';
import TagsInput from '@/components/tags-input/tags-input';
import { useActivity } from '@/hooks/use-activity';
import { useContact } from '@/hooks/use-contact';
import { useTagActions } from '@/hooks/use-tag-actions';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning';
import { useUpdateContact } from '@/hooks/use-update-contact';
import { tagsService } from '@/services/tags.service';
import type { ContactFormValues, Tag } from '@/types';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './view.module.scss';

/**
 * A query-param route (`/contacts/view?id=...`) rather than a dynamic
 * `[id].tsx` segment — this project builds with `output: 'export'`, which
 * requires `getStaticPaths` to know every path at build time. Contact ids
 * are runtime/DB-driven, so a query string sidesteps that requirement
 * entirely while staying just as shareable/bookmarkable.
 */
export default function ContactDetailPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { contact, loading, error, setContact, reload } = useContact(id);
  const {
    items: activityItems,
    loading: activityLoading,
    error: activityError,
    reload: reloadActivity,
  } = useActivity(id);
  const { save, saving, serverError, setServerError } = useUpdateContact(id);
  const { addTag, removeTag, pending: tagPending } = useTagActions();
  const [allTagNames, setAllTagNames] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    tagsService.listAll({
      onSuccess: (result) => setAllTagNames((result.data || []).map((t) => t.name)),
      onError: () => setAllTagNames([]),
    });
  }, []);

  const handleSubmit = (formValues: ContactFormValues) => {
    if (!contact) return;
    save(formValues, contact.version, {
      onSuccess: (updated) => {
        setContact(updated);
        reloadActivity();
        showToast('Contact saved.');
      },
      onConflict: (draft, latest) => {
        openModal(
          <ConflictModal
            draft={draft}
            latest={latest}
            onReloadLatest={(latestContact) => {
              setContact(latestContact);
              setServerError(null);
            }}
            onOverwriteAnyway={(draftValues, latestVersion) => {
              save(draftValues, latestVersion, {
                onSuccess: (updated) => {
                  setContact(updated);
                  reloadActivity();
                  showToast('Contact saved.');
                },
                onConflict: (_draft2, latest2) => {
                  // Extremely unlikely (another write landed in the few ms
                  // it took to resubmit) — fall back to a plain error
                  // instead of recursing into another modal.
                  setServerError('This contact changed again. Please review the latest version.');
                  setContact(latest2);
                },
              });
            }}
          />,
          'conflictRecord',
          'Resolve update conflict'
        );
      },
    });
  };

  const handleAddTag = (tagName: string) => {
    if (!id) return;
    addTag(id, tagName, {
      onSuccess: () => {
        reload();
        reloadActivity();
      },
    });
  };

  const handleRemoveTag = (tag: Tag) => {
    if (!id) return;
    removeTag(id, tag.id, {
      onSuccess: () => {
        reload();
        reloadActivity();
      },
    });
  };

  const loadErrorMessage =
    error === 'not-found' ? 'This contact could not be found.' : error ? 'Could not load this contact.' : null;

  return (
    <>
      <Head>
        <title>
          {contact ? `${contact.firstName} ${contact.lastName}` : 'Contact'} · CRM Contact Workspace
        </title>
      </Head>
      <main id="main-content" className={styles.page}>
        <Link href="/" className={styles.back}>
          ← Back to contacts
        </Link>

        <QueryState loading={loading} error={loadErrorMessage} isEmpty={false}>
          {contact ? (
            <>
              <h2 className="text-heading-xxs">
                {contact.firstName} {contact.lastName}
              </h2>

              <section aria-labelledby="edit-heading" className={styles.section}>
                <h2 id="edit-heading" className={styles.sectionTitle}>
                  Details
                </h2>
                <ContactForm
                  contact={contact}
                  onSubmit={handleSubmit}
                  onDirtyChange={setIsDirty}
                  saving={saving}
                  serverError={serverError}
                />
              </section>

              <section aria-labelledby="tags-heading" className={styles.section}>
                <h2 id="tags-heading" className={styles.sectionTitle}>
                  Tags
                </h2>
                <TagsInput
                  tags={contact.tags}
                  allTagNames={allTagNames}
                  onAdd={handleAddTag}
                  onRemove={handleRemoveTag}
                  pending={tagPending}
                />
              </section>

              <section aria-labelledby="activity-heading" className={styles.section}>
                <h2 id="activity-heading" className={styles.sectionTitle}>
                  Recent activity
                </h2>
                <ActivityFeed items={activityItems} loading={activityLoading} error={activityError} />
              </section>
            </>
          ) : null}
        </QueryState>
      </main>
    </>
  );
}
