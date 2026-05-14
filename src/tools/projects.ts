import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantisClient } from "../client.js";
import type { Mode } from "../config.js";
import { Ref, errorResult, jsonResult } from "./_helpers.js";

export function registerProjectTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  // ----------- READ -----------

  server.tool(
    "mantis_list_projects",
    "List all Mantis projects visible to the authenticated user.",
    {},
    async () => {
      try {
        const data = await client.get(`/api/rest/projects/`);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_project",
    "Get a single project by ID.",
    {
      project_id: z.number().int().positive(),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get(`/api/rest/projects/${project_id}`);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_list_project_users",
    "List all users assigned to a project.",
    {
      project_id: z.number().int().positive(),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get(
          `/api/rest/projects/${project_id}/users`,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_list_project_handlers",
    "List users in a project who can be assigned (i.e. handle) issues.",
    {
      project_id: z.number().int().positive(),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get(
          `/api/rest/projects/${project_id}/handlers`,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_list_project_versions",
    "List all versions (releases) defined for a project.",
    {
      project_id: z.number().int().positive(),
    },
    async ({ project_id }) => {
      try {
        const data = await client.get(
          `/api/rest/projects/${project_id}/versions`,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_project_version",
    "Get a single project version by ID.",
    {
      project_id: z.number().int().positive(),
      version_id: z.number().int().positive(),
    },
    async ({ project_id, version_id }) => {
      try {
        const data = await client.get(
          `/api/rest/projects/${project_id}/versions/${version_id}`,
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
    "mantis_create_project",
    "Create a new Mantis project.",
    {
      name: z.string().min(1),
      description: z.string().optional(),
      status: Ref.optional(),
      view_state: Ref.optional(),
      file_path: z.string().optional(),
      enabled: z.boolean().optional(),
      inherit_global: z.boolean().optional(),
    },
    async (args) => {
      try {
        const data = await client.post(`/api/rest/projects/`, args);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_update_project",
    "Partially update an existing project.",
    {
      project_id: z.number().int().positive(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: Ref.optional(),
      view_state: Ref.optional(),
      file_path: z.string().optional(),
      enabled: z.boolean().optional(),
      inherit_global: z.union([z.boolean(), z.number().int()]).optional(),
    },
    async ({ project_id, ...patch }) => {
      try {
        const data = await client.patch(
          `/api/rest/projects/${project_id}`,
          patch,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_project",
    "Permanently delete a project and all of its issues. This cannot be undone.",
    {
      project_id: z.number().int().positive(),
    },
    async ({ project_id }) => {
      try {
        const data = await client.delete(`/api/rest/projects/${project_id}`);
        return jsonResult(data ?? { deleted: project_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_create_project_version",
    "Create a new version (release) inside a project.",
    {
      project_id: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().optional(),
      released: z.boolean().optional(),
      obsolete: z.boolean().optional(),
      timestamp: z
        .string()
        .optional()
        .describe("ISO date (YYYY-MM-DD) or full ISO timestamp"),
    },
    async ({ project_id, ...body }) => {
      try {
        const data = await client.post(
          `/api/rest/projects/${project_id}/versions/`,
          body,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_update_project_version",
    "Partially update a project version.",
    {
      project_id: z.number().int().positive(),
      version_id: z.number().int().positive(),
      name: z.string().optional(),
      description: z.string().optional(),
      released: z.boolean().optional(),
      obsolete: z.boolean().optional(),
      timestamp: z.string().optional(),
    },
    async ({ project_id, version_id, ...patch }) => {
      try {
        const data = await client.patch(
          `/api/rest/projects/${project_id}/versions/${version_id}`,
          patch,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_project_version",
    "Delete a project version.",
    {
      project_id: z.number().int().positive(),
      version_id: z.number().int().positive(),
    },
    async ({ project_id, version_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/projects/${project_id}/versions/${version_id}`,
        );
        return jsonResult(data ?? { deleted: version_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_add_subproject",
    "Attach an existing project as a sub-project of another project.",
    {
      project_id: z.number().int().positive(),
      subproject: Ref,
      inherit_parent: z.boolean().optional(),
    },
    async ({ project_id, subproject, inherit_parent }) => {
      try {
        const body: Record<string, unknown> = { project: subproject };
        if (inherit_parent !== undefined) body.inherit_parent = inherit_parent;
        const data = await client.post(
          `/api/rest/projects/${project_id}/subprojects`,
          body,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_update_subproject",
    "Update the sub-project link (e.g. toggle inherit_parent).",
    {
      project_id: z.number().int().positive(),
      subproject_id: z.number().int().positive(),
      project: Ref.optional(),
      inherit_parent: z.boolean().optional(),
    },
    async ({ project_id, subproject_id, ...body }) => {
      try {
        const data = await client.patch(
          `/api/rest/projects/${project_id}/subprojects/${subproject_id}`,
          body,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_set_project_user",
    "Add or update a user's access level on a project. `access_level` accepts `{name}` (e.g. 'reporter', 'developer', 'manager') or `{id}`.",
    {
      project_id: z.number().int().positive(),
      user: Ref,
      access_level: Ref,
    },
    async ({ project_id, user, access_level }) => {
      try {
        const data = await client.put(
          `/api/rest/projects/${project_id}/users/`,
          { user, access_level },
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_remove_project_user",
    "Remove a user from a project's access list.",
    {
      project_id: z.number().int().positive(),
      user_id: z.number().int().positive(),
    },
    async ({ project_id, user_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/projects/${project_id}/users/${user_id}`,
        );
        return jsonResult(data ?? { removed: user_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
