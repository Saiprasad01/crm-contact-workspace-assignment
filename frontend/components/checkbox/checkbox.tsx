import type { ChangeEventHandler } from 'react';
import styles from './checkbox.module.scss';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  label?: string;
  hideLabel?: boolean;
}

export default function Checkbox({ id, checked, onChange, label, hideLabel = false }: CheckboxProps) {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={styles.input}
      />
      {label ? <span className={hideLabel ? 'visually-hidden' : styles.label}>{label}</span> : null}
    </label>
  );
}
