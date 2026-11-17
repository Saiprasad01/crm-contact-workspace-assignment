import styles from './search.module.scss';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Search({
  value,
  onChange,
  placeholder = 'Search by name, email, or phone',
}: SearchProps) {
  return (
    <div className={styles.wrapper}>
      <label htmlFor="contacts-search" className={styles.label}>
        Search
      </label>
      <input
        id="contacts-search"
        type="search"
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
