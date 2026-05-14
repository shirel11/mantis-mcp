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
