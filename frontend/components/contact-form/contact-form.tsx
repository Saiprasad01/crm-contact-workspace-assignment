import type { Contact, ContactFormValues } from '@/types';
import { CONTACT_FORM_SCHEMA, validateForm } from '@/utils/validation';
import type { ChangeEvent, FormEvent, HTMLInputTypeAttribute } from 'react';
import { useEffect, useState } from 'react';
import styles from './contact-form.module.scss';

interface FieldDef {
  name: keyof ContactFormValues;
  label: string;
  type: HTMLInputTypeAttribute;
}

const FIELDS: FieldDef[] = [
  { name: 'firstName', label: 'First name', type: 'text' },
  { name: 'lastName', label: 'Last name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'company', label: 'Company', type: 'text' },
];

function valuesFromContact(contact: Contact | null | undefined): ContactFormValues {
  return {
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
  };
}

interface ContactFormProps {
  contact: Contact | null;
  onSubmit: (values: ContactFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saving?: boolean;
  serverError?: string | null;
}

/** Hand-rolled form state + `validateForm` (no React Hook Form / Zod — see
 * PROJECT_IMPLEMENTATION_PLAN.md Assumption 7). Reports dirtiness upward so
 * the page can wire `useUnsavedChangesWarning`. */
export default function ContactForm({ contact, onSubmit, onDirtyChange, saving, serverError }: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>(() => valuesFromContact(contact));
  const [initialValues, setInitialValues] = useState<ContactFormValues>(() => valuesFromContact(contact));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-sync when a fresh contact loads, or after a conflict's "reload latest".
  useEffect(() => {
    const next = valuesFromContact(contact);
    setValues(next);
    setInitialValues(next);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on identity/version, not the whole object
  }, [contact?.id, contact?.version]);

  const isDirty = FIELDS.some((field) => values[field.name] !== initialValues[field.name]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleChange = (name: keyof ContactFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { valid, errors: validationErrors } = validateForm(
      values as unknown as Record<string, unknown>,
      CONTACT_FORM_SCHEMA
    );
    setErrors(validationErrors);
    if (!valid) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {FIELDS.map((field) => {
        const errorId = `${field.name}-error`;
        const hasError = Boolean(errors[field.name]);
        return (
          <div className="field" key={field.name}>
            <label className="field__label" htmlFor={field.name}>
              {field.label}
            </label>
            <input
              id={field.name}
              type={field.type}
              className={`field__input ${hasError ? 'field__input--invalid' : ''}`}
              value={values[field.name]}
              onChange={handleChange(field.name)}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : undefined}
            />
            {hasError ? (
              <span id={errorId} className="field__error" role="alert">
                {errors[field.name]}
              </span>
            ) : null}
          </div>
        );
      })}

      {serverError ? (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className="btn btn--primary" disabled={saving || !isDirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {isDirty ? <span className="text-body-s">Unsaved changes</span> : null}
      </div>
    </form>
  );
}
