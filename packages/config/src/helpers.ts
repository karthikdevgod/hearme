import { z } from 'zod';

/** "true"/"1"/"yes" -> true. Anything else -> false. Tolerant of unset values. */
export const zBool = (def = false) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return def;
      return ['true', '1', 'yes', 'on'].includes(v.toLowerCase());
    });

/** Numeric env var, validated as a finite number. */
export const zNum = (def?: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === '') {
        if (def !== undefined) return def;
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'required number' });
        return z.NEVER;
      }
      const n = Number(v);
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `not a number: ${v}` });
        return z.NEVER;
      }
      return n;
    });

/** Comma-separated list of strings -> string[] (trimmed, empties dropped). */
export const zStrList = (def: string[] = []) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v === undefined || v === ''
        ? def
        : v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    );

/** Comma-separated list of numbers -> number[]. */
export const zNumList = (def: number[] = []) =>
  z
    .string()
    .optional()
    .transform((v) =>
      v === undefined || v === ''
        ? def
        : v
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n)),
    );

/** A required, non-empty secret. Allowed empty in development so the app can boot without keys. */
export const zSecret = (isProd: boolean) =>
  isProd ? z.string().min(1, 'required in production') : z.string().optional().default('');
