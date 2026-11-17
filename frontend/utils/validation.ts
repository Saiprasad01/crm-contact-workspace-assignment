/**
 * Form validation utilities: regex patterns, type checks, and schema-based
 * validation. Pattern ported from ai-media-cpcm-frontend-ui/utils/validation.js,
 * trimmed to the rules this app's contact form actually needs (no RHF/Zod —
 * see PROJECT_IMPLEMENTATION_PLAN.md Assumption 7 for why).
 */
import type { ContactFormValues } from '@/types';

const PATTERNS = {
  /** Email: standard format */
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  /** Phone: optional +, 7-20 digits/spaces/dashes */
  phone: /^[+0-9()\-.\s]{7,20}$/,
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function isEmail(value: unknown): boolean {
  return typeof value === 'string' && PATTERNS.email.test(value.trim());
}

function isPhone(value: unknown): boolean {
  return typeof value === 'string' && PATTERNS.phone.test(value.trim());
}

type Validator = (value: unknown) => string | null;

const RULE_TYPES = {
  required:
    (message?: string): Validator =>
    (value) =>
      !isEmpty(value) ? null : message ?? 'This field is required',
  email: ((value: unknown) =>
    isEmpty(value) ? null : isEmail(value) ? null : 'Enter a valid email address') as Validator,
  phone: ((value: unknown) =>
    isEmpty(value) ? null : isPhone(value) ? null : 'Enter a valid phone number') as Validator,
  maxLength:
    (max: number): Validator =>
    (value) =>
      isEmpty(value)
        ? null
        : typeof value === 'string' && value.length <= max
          ? null
          : `Max ${max} characters`,
};

type RuleName = keyof typeof RULE_TYPES;
const FACTORY_RULES: RuleName[] = ['required', 'maxLength'];

export type Rule = RuleName | [RuleName, string | number | undefined];
export type ValidationSchema = Record<string, Rule[]>;

function validateField(value: unknown, rules: Rule[]): { valid: boolean; message: string | null } {
  for (const rule of rules) {
    const tuple = Array.isArray(rule) ? rule : null;
    const ruleName: RuleName = tuple ? tuple[0] : (rule as RuleName);
    const ruleArg: string | number | undefined = tuple ? tuple[1] : undefined;
    const entry = RULE_TYPES[ruleName];
    const validator: Validator | undefined = FACTORY_RULES.includes(ruleName)
      ? (entry as (arg?: string | number) => Validator)(ruleArg)
      : (entry as Validator);
    if (typeof validator !== 'function') continue;
    const message = validator(value);
    if (message) return { valid: false, message };
  }
  return { valid: true, message: null };
}

export function validateForm(
  data: Record<string, unknown>,
  schema: ValidationSchema
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const field of Object.keys(schema)) {
    const result = validateField(data[field], schema[field]);
    if (!result.valid && result.message) errors[field] = result.message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export const CONTACT_FORM_SCHEMA: Record<keyof ContactFormValues, Rule[]> = {
  firstName: ['required', ['maxLength', 100]],
  lastName: ['required', ['maxLength', 100]],
  email: ['email', ['maxLength', 150]],
  phone: ['phone', ['maxLength', 30]],
  company: [['maxLength', 150]],
};
