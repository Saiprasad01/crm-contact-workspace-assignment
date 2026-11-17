import { CONTACT_FORM_SCHEMA, validateForm } from '@/utils/validation';
import { describe, expect, it } from 'vitest';

const base = { firstName: '', lastName: '', email: '', phone: '', company: '' };

describe('validateForm with CONTACT_FORM_SCHEMA', () => {
  it('requires first and last name', () => {
    const { valid, errors } = validateForm(base, CONTACT_FORM_SCHEMA);
    expect(valid).toBe(false);
    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
  });

  it('rejects an invalid email but allows an empty one', () => {
    const invalid = validateForm(
      { ...base, firstName: 'Ada', lastName: 'Lovelace', email: 'not-an-email' },
      CONTACT_FORM_SCHEMA
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.email).toBeTruthy();

    const emptyEmail = validateForm(
      { ...base, firstName: 'Ada', lastName: 'Lovelace' },
      CONTACT_FORM_SCHEMA
    );
    expect(emptyEmail.valid).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    const { valid, errors } = validateForm(
      { ...base, firstName: 'Ada', lastName: 'Lovelace', phone: 'abc' },
      CONTACT_FORM_SCHEMA
    );
    expect(valid).toBe(false);
    expect(errors.phone).toBeTruthy();
  });

  it('enforces maxLength on company', () => {
    const { valid, errors } = validateForm(
      { ...base, firstName: 'Ada', lastName: 'Lovelace', company: 'x'.repeat(151) },
      CONTACT_FORM_SCHEMA
    );
    expect(valid).toBe(false);
    expect(errors.company).toBeTruthy();
  });

  it('passes with a fully valid contact', () => {
    const { valid } = validateForm(
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+1 555 123 4567',
        company: 'Acme',
      },
      CONTACT_FORM_SCHEMA
    );
    expect(valid).toBe(true);
  });
});
