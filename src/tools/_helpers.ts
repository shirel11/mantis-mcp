import { z } from "zod";

export const Ref = z
  .object({
    id: z.number().int().optional(),
    name: z.string().optional(),
  })
  .refine((v) => v.id !== undefined || v.name !== undefined, {
    message: "Either id or name is required",
  });
export type RefT = z.infer<typeof Ref>;

export const AttachmentInput = z.object({
  path: z.string().min(1).describe("Absolute or relative path to a local file"),
  name: z
    .string()
    .optional()
    .describe("Override file name as stored in Mantis (defaults to basename)"),
});
export type AttachmentInputT = z.infer<typeof AttachmentInput>;

export function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          data === undefined || data === null
            ? "(no content)"
            : typeof data === "string"
              ? data
              : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

/**
 * Flatten a Mantis issue (or any similar object) into a compact shape suitable
 * for LLM list responses. Mantis returns nested enum-like objects for fields
 * such as status, priority, handler, reporter, project, category — each with
 * `{id, name, label, color, real_name, email, ...}`. For list/index views the
 * LLM almost never needs the extra metadata, so we collapse each nested object
 * to its `name` (preferred) or `id`, and collapse arrays of refs the same way.
 *
 * Top-level scalars (id, summary, sticky, created_at, updated_at, ...) are
 * kept verbatim. The `description` and similar long-text fields are preserved
 * if present — the caller controls whether they're requested at all via the
 * Mantis `select` parameter.
 */
export function compactIssue(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object" || Array.isArray(input)) return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      out[key] = value.map((v) => {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const rec = v as Record<string, unknown>;
          if (typeof rec.name === "string") return rec.name;
          if (typeof rec.id === "number" || typeof rec.id === "string")
            return rec.id;
        }
        return v;
      });
      continue;
    }

    if (typeof value === "object") {
      const rec = value as Record<string, unknown>;
      if (typeof rec.name === "string") {
        out[key] = rec.name;
        continue;
      }
      if (typeof rec.id === "number" || typeof rec.id === "string") {
        out[key] = rec.id;
        continue;
      }
      out[key] = value;
      continue;
    }

    out[key] = value;
  }
  return out;
}
