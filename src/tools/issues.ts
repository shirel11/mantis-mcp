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

export function registerIssueTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  // ----------- READ -----------

  server.tool(
    "mantis_get_issue",
    "Get a single Mantis issue by its numeric ID. Optionally restrict returned fields with `select` (comma-separated, e.g. 'id,summary,description').",
    {
      issue_id: z.number().int().positive(),
      select: z
        .string()
        .optional()
        .describe("Comma-separated field list to limit response payload"),
    },
    async ({ issue_id, select }) => {
      try {
        const data = await client.get(`/api/rest/issues/${issue_id}`, {
          select,
        });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_list_issues",
    [
      "List Mantis issues with optional filtering and pagination.",
      "`filter_id` accepts a numeric custom filter id or one of the convenience values:",
      "  - 'assigned'   : issues assigned to the authenticated user",
      "  - 'reported'   : issues reported by the authenticated user",
      "  - 'monitored'  : issues monitored by the authenticated user",
      "  - 'unassigned' : issues with no handler",
      "`project_id` limits to a project. `select` is a comma-separated field list.",
    ].join("\n"),
    {
      project_id: z.number().int().positive().optional(),
      filter_id: z
        .union([z.number().int().positive(), z.string()])
        .optional()
        .describe(
          "Numeric custom filter id, or one of: assigned | reported | monitored | unassigned",
        ),
      page: z.number().int().positive().optional(),
      page_size: z.number().int().positive().max(100).optional(),
      select: z.string().optional(),
    },
    async ({ project_id, filter_id, page, page_size, select }) => {
      try {
        const data = await client.get(`/api/rest/issues`, {
          project_id,
          filter_id,
          page,
          page_size,
          select,
        });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_issue_files",
    "List all attachments on a Mantis issue.",
    {
      issue_id: z.number().int().positive(),
    },
    async ({ issue_id }) => {
      try {
        const data = await client.get(`/api/rest/issues/${issue_id}/files`);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_issue_file",
    "Get a single attachment from an issue by file id. Returns metadata; the file content is base64-encoded in the response if Mantis includes it.",
    {
      issue_id: z.number().int().positive(),
      file_id: z.number().int().positive(),
    },
    async ({ issue_id, file_id }) => {
      try {
        const data = await client.get(
          `/api/rest/issues/${issue_id}/files/${file_id}`,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  if (mode !== "readwrite") return;

  // ----------- WRITE -----------

  server.tool(
    "mantis_create_issue",
    "Create a new Mantis issue. `project` and `category` are required by Mantis. Nested references (project, category, handler, status, priority, severity, view_state, resolution) accept either `{id}`, `{name}`, or both. Optional `files` is a list of local file paths; they are read from disk and base64-encoded automatically.",
    {
      summary: z.string().min(1),
      description: z.string().min(1),
      additional_information: z.string().optional(),
      steps_to_reproduce: z.string().optional(),
      project: Ref,
      category: Ref,
      handler: Ref.optional(),
      reporter: Ref.optional(),
      status: Ref.optional(),
      resolution: Ref.optional(),
      view_state: Ref.optional(),
      priority: Ref.optional(),
      severity: Ref.optional(),
      reproducibility: Ref.optional(),
      version: z.string().optional(),
      target_version: z.string().optional(),
      fixed_in_version: z.string().optional(),
      sticky: z.boolean().optional(),
      tags: z.array(Ref).optional(),
      custom_fields: z
        .array(
          z.object({
            field: Ref,
            value: z.unknown(),
          }),
        )
        .optional(),
      files: z.array(AttachmentInput).optional(),
    },
    async (args) => {
      try {
        const { files, ...rest } = args;
        const fileBodies = await MantisClient.readAttachments(files);
        const body: Record<string, unknown> = { ...rest };
        if (fileBodies) body.files = fileBodies;
        const data = await client.post(`/api/rest/issues`, body);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_update_issue",
    "Partially update an existing issue. Only include fields that should change. To add a note as part of the update, include `notes: [{ text, view_state? }]`.",
    {
      issue_id: z.number().int().positive(),
      summary: z.string().optional(),
      description: z.string().optional(),
      additional_information: z.string().optional(),
      steps_to_reproduce: z.string().optional(),
      project: Ref.optional(),
      category: Ref.optional(),
      handler: Ref.optional(),
      status: Ref.optional(),
      resolution: Ref.optional(),
      view_state: Ref.optional(),
      priority: Ref.optional(),
      severity: Ref.optional(),
      reproducibility: Ref.optional(),
      sticky: z.boolean().optional(),
      tags: z.array(Ref).optional(),
      custom_fields: z
        .array(
          z.object({
            field: Ref,
            value: z.unknown(),
          }),
        )
        .optional(),
      notes: z
        .array(
          z.object({
            text: z.string(),
            view_state: Ref.optional(),
          }),
        )
        .optional(),
    },
    async ({ issue_id, ...patch }) => {
      try {
        const data = await client.patch(
          `/api/rest/issues/${issue_id}`,
          patch,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_issue",
    "Permanently delete a Mantis issue by ID. This cannot be undone.",
    {
      issue_id: z.number().int().positive(),
    },
    async ({ issue_id }) => {
      try {
        const data = await client.delete(`/api/rest/issues/${issue_id}`);
        return jsonResult(data ?? { deleted: issue_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_monitor_issue",
    "Add the current user (or a list of specified users) as monitors of an issue. Omit `users` to monitor as yourself.",
    {
      issue_id: z.number().int().positive(),
      users: z
        .array(
          z.object({
            id: z.number().int().optional(),
            name: z.string().optional(),
            name_or_realname: z.string().optional(),
          }),
        )
        .optional(),
    },
    async ({ issue_id, users }) => {
      try {
        const body = users ? { users } : undefined;
        const data = await client.post(
          `/api/rest/issues/${issue_id}/monitors`,
          body,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_add_issue_tags",
    "Attach one or more tags to an issue. Each tag is referenced by `{id}`, `{name}`, or both.",
    {
      issue_id: z.number().int().positive(),
      tags: z.array(Ref).min(1),
    },
    async ({ issue_id, tags }) => {
      try {
        const data = await client.post(
          `/api/rest/issues/${issue_id}/tags`,
          { tags },
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_remove_issue_tag",
    "Detach a tag from an issue.",
    {
      issue_id: z.number().int().positive(),
      tag_id: z.number().int().positive(),
    },
    async ({ issue_id, tag_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/issues/${issue_id}/tags/${tag_id}`,
        );
        return jsonResult(data ?? { detached: tag_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_add_issue_relationship",
    "Create a relationship between two issues. `type` examples: related-to, duplicate-of, has-duplicate, parent-of, child-of.",
    {
      issue_id: z.number().int().positive(),
      related_issue_id: z.number().int().positive(),
      type: z
        .union([
          z.object({ name: z.string() }),
          z.object({ id: z.number().int() }),
        ])
        .describe("Relationship type, e.g. { name: 'related-to' }"),
    },
    async ({ issue_id, related_issue_id, type }) => {
      try {
        const data = await client.post(
          `/api/rest/issues/${issue_id}/relationships/`,
          {
            issue: { id: related_issue_id },
            type,
          },
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_issue_relationship",
    "Delete a relationship from an issue by relationship id.",
    {
      issue_id: z.number().int().positive(),
      relationship_id: z.number().int().positive(),
    },
    async ({ issue_id, relationship_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/issues/${issue_id}/relationships/${relationship_id}`,
        );
        return jsonResult(data ?? { deleted: relationship_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
