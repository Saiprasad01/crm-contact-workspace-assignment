import Checkbox from '@/components/checkbox/checkbox';
import type { Tag } from '@/types';
import styles from './filters-panel.module.scss';

interface FiltersPanelProps {
  allTags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  company: string;
  onCompanyChange: (value: string) => void;
}

/** The brief's "filter by at least two attributes" — company (text, partial
 * match) and tags (multi-select). */
export default function FiltersPanel({
  allTags,
  selectedTags,
  onToggleTag,
  company,
  onCompanyChange,
}: FiltersPanelProps) {
  return (
    <fieldset className={styles.panel}>
      <legend className="visually-hidden">Filter contacts</legend>

      <div className={styles.group}>
        <label htmlFor="company-filter" className={styles.label}>
          Company
        </label>
        <input
          id="company-filter"
          type="text"
          className={styles.input}
          value={company}
          onChange={(event) => onCompanyChange(event.target.value)}
          placeholder="Any company"
        />
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Tags</span>
        <div className={styles.tagList}>
          {allTags.map((tag) => (
            <Checkbox
              key={tag.id}
              id={`tag-filter-${tag.id}`}
              label={tag.name}
              checked={selectedTags.includes(tag.name)}
              onChange={() => onToggleTag(tag.name)}
            />
          ))}
        </div>
      </div>
    </fieldset>
  );
}
