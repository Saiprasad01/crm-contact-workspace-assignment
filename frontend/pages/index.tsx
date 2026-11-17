import { showToast } from '@/components/app-toast/app-toast';
import BulkActionBar from '@/components/bulk-action-bar/bulk-action-bar';
import ContactsCardList from '@/components/contacts-card-list/contacts-card-list';
import ContactsTable from '@/components/contacts-table/contacts-table';
import FiltersPanel from '@/components/filters-panel/filters-panel';
import Pagination from '@/components/pagination/pagination';
import QueryState from '@/components/query-state/query-state';
import Search from '@/components/search/search';
import { useContacts } from '@/hooks/use-contacts';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTagActions } from '@/hooks/use-tag-actions';
import { tagsService } from '@/services/tags.service';
import type { SortBy, SortDir, Tag } from '@/types';
import { buildContactsQuery, parseContactsQuery } from '@/utils/query-params';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import styles from './index.module.scss';

export default function ContactsListPage() {
  const router = useRouter();
  const queryState = useMemo(() => parseContactsQuery(router.query), [router.query]);

  const [rawSearch, setRawSearch] = useState(queryState.q);
  const debouncedSearch = useDebouncedValue(rawSearch, 300);

  const [rawCompany, setRawCompany] = useState(queryState.company);
  const debouncedCompany = useDebouncedValue(rawCompany, 300);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const { data, loading, error, refetch } = useContacts(queryState);
  const { bulkAssignTag, pending: bulkPending, error: bulkError } = useTagActions();

  // Fetch the tag catalogue once, for the filter panel and the bulk-tag
  // autocomplete — not re-fetched on every list query.
  useEffect(() => {
    tagsService.listAll({
      onSuccess: (result) => setAllTags(result.data || []),
      onError: () => setAllTags([]),
    });
  }, []);

  const queryKey = JSON.stringify(queryState);
  useEffect(() => {
    setSelectedIds(new Set());
  }, [queryKey]);

  const pushQuery = (partial: Partial<typeof queryState>, { resetPage = true } = {}) => {
    const next = { ...queryState, ...partial };
    if (resetPage) next.page = 1;
    router.push({ pathname: '/', query: buildContactsQuery(next) });
  };

  // Debounced search/company -> URL, only once the debounce settles and the
  // value actually differs from what's already in the URL.
  useEffect(() => {
    if (debouncedSearch !== queryState.q) pushQuery({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-running on queryState would fight the debounce
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedCompany !== queryState.company) pushQuery({ company: debouncedCompany });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-running on queryState would fight the debounce
  }, [debouncedCompany]);

  const handleToggleTag = (tagName: string) => {
    const nextTags = queryState.tags.includes(tagName)
      ? queryState.tags.filter((t) => t !== tagName)
      : [...queryState.tags, tagName];
    pushQuery({ tags: nextTags });
  };

  const handleSort = (field: SortBy, dir: SortDir) => pushQuery({ sortBy: field, sortDir: dir });
  const handlePageChange = (page: number) => pushQuery({ page }, { resetPage: false });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (selectAll: boolean) => {
    setSelectedIds(selectAll ? new Set((data?.items || []).map((c) => c.id)) : new Set());
  };

  const handleBulkAssignTag = (tagName: string) => {
    bulkAssignTag(Array.from(selectedIds), tagName, {
      onSuccess: ({ updated, skipped }) => {
        setSelectedIds(new Set());
        refetch();
        showToast(
          `Tagged ${updated} contact${updated === 1 ? '' : 's'}${skipped ? ` (${skipped} already had it)` : ''} with "${tagName}".`
        );
      },
    });
  };

  return (
    <>
      <Head>
        <title>CRM Contact Workspace</title>
      </Head>
      <main id="main-content" className={styles.page}>
        <h2 className="text-heading-xxs">Contacts</h2>

        <div className={styles.toolbar}>
          <Search value={rawSearch} onChange={setRawSearch} />
          <FiltersPanel
            allTags={allTags}
            selectedTags={queryState.tags}
            onToggleTag={handleToggleTag}
            company={rawCompany}
            onCompanyChange={setRawCompany}
          />
        </div>

        <BulkActionBar
          selectedCount={selectedIds.size}
          allTagNames={allTags.map((t) => t.name)}
          onAssignTag={handleBulkAssignTag}
          pending={bulkPending}
        />
        {bulkError ? (
          <p role="alert" className={styles.bulkError}>
            {bulkError}
          </p>
        ) : null}

        <QueryState
          loading={loading}
          error={error}
          isEmpty={Boolean(data) && data!.items.length === 0}
          emptyLabel="No contacts match these filters."
        >
          {data ? (
            <>
              <ContactsTable
                contacts={data.items}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                sortBy={queryState.sortBy}
                sortDir={queryState.sortDir}
                onSort={handleSort}
              />
              <ContactsCardList
                contacts={data.items}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
              <div className={styles.footer}>
                <span className="text-body-s">{data.total} total contacts</span>
                <Pagination page={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
              </div>
            </>
          ) : null}
        </QueryState>
      </main>
    </>
  );
}
