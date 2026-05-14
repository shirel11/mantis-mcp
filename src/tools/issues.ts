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

  const DEFAULT_LIST_PAGE_SIZE = 25;
  const MAX_LIST_PAGE_SIZE = 100;
  // Lightweight projection to keep list responses inside LLM token budgets.
  // Each issue's history / notes / attachments / custom_fields / relationships
  // can be huge; users fetch them per-issue with mantis_get_issue if needed.
  const DEFAULT_LIST_SELECT =
    "id,summary,status,priority,severity,handler,reporter,project,category,sticky,created_at,updated_at";

  server.tool(
    "mantis_list_issues",
    [
      "List Mantis issues. **PAGINATED** — always check the `pagination.has_more` field in the response and call again with the next `page` number if you need more results. Do NOT assume a single call returns every issue.",
      "",
      "Defaults: `page=1`, `page_size=25`. Each issue is returned with a lightweight projection (id, summary, status, priority, severity, handler, reporter, project, category, sticky, created_at, updated_at) so responses stay small.",
      "",
      "Parameters:",
      "  - project_id : limit to one project",
      "  - filter_id  : numeric custom filter id, or one of: 'assigned' | 'reported' | 'monitored' | 'unassigned'",
      "  - page       : 1-based page number (default 1)",
      "  - page_size  : items per page, max 100 (default 25)",
      "  - select     : comma-separated field list — overrides the lightweight default",
      "  - full       : if true, fetch every field (use sparingly — payload can be very large)",
      "",
      "To see all fields of a specific issue (description, notes, history, attachments, ...), call `mantis_get_issue` with that issue's id.",
    ].join("\n"),
    {
      project_id: z.number().int().positive().optional(),
      filter_id: z
        .union([z.number().int().positive(), z.string()])
        .optional()
        .describe(
          "Numeric custom filter id, or one of: assigned | reported | monitored | unassigned",
        ),
      page: z
        .number()
        .int()
        .positive()
        .default(1)
        .describe("1-based page number (default 1)"),
      page_size: z
        .number()
        .int()
        .positive()
        .max(MAX_LIST_PAGE_SIZE)
        .default(DEFAULT_LIST_PAGE_SIZE)
        .describe(`Items per page; max ${MAX_LIST_PAGE_SIZE}, default ${DEFAULT_LIST_PAGE_SIZE}`),
      select: z
        .string()
        .optional()
        .describe(
          "Comma-separated fields to return. Overrides the lightweight default projection.",
        ),
      full: z
        .boolean()
        .optional()
        .describe(
          "If true, fetch every field instead of the lightweight projection. Use sparingly.",
        ),
    },
    async ({ project_id, filter_id, page, page_size, select, full }) => {
      try {
        const effectiveSelect = full ? undefined : (select ?? DEFAULT_LIST_SELECT);
        const data = await client.get<
          { issues?: unknown[] } & Record<string, unknown>
        >(`/api/rest/issues`, {
          project_id,
          filter_id,
          page,
          page_size,
          select: effectiveSelect,
        });
        const issues = Array.isArray(data?.issues) ? data.issues : [];
        const hasMore = issues.length === page_size;
        const result = {
          pagination: {
            page,
            page_size,
            returned: issues.length,
            has_more: hasMore,
            next_page: hasMore ? page + 1 : null,
            hint: hasMore
              ? `More results may exist. Call mantis_list_issues again with page=${page + 1} (and the same other parameters) to fetch the next batch.`
              : "This is the last page (returned fewer items than page_size).",
          },
          issues,
        };
        return jsonResult(result);
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
