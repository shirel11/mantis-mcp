import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantisClient } from "../client.js";
import type { Mode } from "../config.js";
import {
  AttachmentInput,
  Ref,
  errorResult,
  jsonResult,
} from "./_helpers.js";

export function registerIssueNoteTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  if (mode !== "readwrite") return;

  server.tool(
    "mantis_create_issue_note",
    "Add a note (comment) to an existing issue. Supports optional time tracking (e.g. duration '00:30') and optional attachments (local file paths).",
    {
      issue_id: z.number().int().positive(),
      text: z.string().min(1),
      view_state: Ref.optional(),
      reporter: Ref.optional(),
      time_tracking: z
        .object({
          duration: z
            .string()
            .regex(/^\d+:\d{2}$/)
            .describe("HH:MM duration, e.g. '01:30'"),
        })
        .optional(),
      files: z.array(AttachmentInput).optional(),
    },
    async ({ issue_id, files, ...rest }) => {
      try {
        const fileBodies = await MantisClient.readAttachments(files);
        const body: Record<string, unknown> = { ...rest };
        if (fileBodies) body.files = fileBodies;
        const data = await client.post(
          `/api/rest/issues/${issue_id}/notes`,
          body,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_issue_note",
    "Delete a note from an issue by note ID.",
    {
      issue_id: z.number().int().positive(),
      issue_note_id: z.number().int().positive(),
    },
    async ({ issue_id, issue_note_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/issues/${issue_id}/notes/${issue_note_id}`,
        );
        return jsonResult(data ?? { deleted: issue_note_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_add_issue_attachments",
    "Add one or more file attachments to an existing issue. Files are read from local paths and base64-encoded automatically.",
    {
      issue_id: z.number().int().positive(),
      files: z.array(AttachmentInput).min(1),
    },
    async ({ issue_id, files }) => {
      try {
        const fileBodies = await MantisClient.readAttachments(files);
        const data = await client.post(
          `/api/rest/issues/${issue_id}/files`,
          { files: fileBodies },
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
