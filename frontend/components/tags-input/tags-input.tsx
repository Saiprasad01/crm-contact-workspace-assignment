import type { Tag } from '@/types';
import type { FormEvent } from 'react';
import { useState } from 'react';
import styles from './tags-input.module.scss';

interface TagsInputProps {
  tags: Tag[];
  allTagNames?: string[];
  onAdd: (tagName: string) => void;
  onRemove: (tag: Tag) => void;
  pending?: boolean;
}

/** View/add/remove tags on a contact, with a <datalist> autocomplete against
 * already-existing tag names so users reuse "VIP" instead of creating
 * "vip"/"Vip" duplicates. */
export default function TagsInput({ tags, allTagNames = [], onAdd, onRemove, pending }: TagsInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className={styles.wrapper}>
      <ul className={styles.chipList} aria-label="Assigned tags">
        {tags.map((tag) => (
          <li key={tag.id} className={styles.chip}>
            {tag.name}
            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemove(tag)}
              aria-label={`Remove tag ${tag.name}`}
              disabled={pending}
            >
              ×
            </button>
          </li>
        ))}
        {tags.length === 0 ? <li className="text-body-s">No tags yet.</li> : null}
      </ul>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="tag-input" className="visually-hidden">
          Add a tag
        </label>
        <input
          id="tag-input"
          list="existing-tags"
          className={styles.input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add a tag…"
          disabled={pending}
        />
        <datalist id="existing-tags">
          {allTagNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="submit"
          className="btn btn--secondary btn--small"
          disabled={pending || !value.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
}
