import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MantisClient } from "../client.js";
import type { Mode } from "../config.js";
import { Ref, errorResult, jsonResult } from "./_helpers.js";

export function registerUserTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  // ----------- READ -----------

  server.tool(
    "mantis_get_my_user",
    "Return information about the user owning the API token currently in use.",
    {
      select: z.string().optional(),
    },
    async ({ select }) => {
      try {
        const data = await client.get(`/api/rest/users/me`, { select });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_user",
    "Get a Mantis user by numeric ID.",
    {
      user_id: z.number().int().positive(),
      select: z.string().optional(),
    },
    async ({ user_id, select }) => {
      try {
        const data = await client.get(`/api/rest/users/${user_id}`, {
          select,
        });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_user_by_username",
    "Get a Mantis user by their username (login name).",
    {
      username: z.string().min(1),
    },
    async ({ username }) => {
      try {
        const data = await client.get(
          `/api/rest/users/username/${encodeURIComponent(username)}`,
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
    "mantis_create_user",
    "Create a new Mantis user. `access_level` accepts `{name}` (e.g. 'viewer', 'reporter', 'developer', 'manager', 'administrator') or `{id}`.",
    {
      username: z.string().min(1),
      password: z.string().min(1),
      real_name: z.string().optional(),
      email: z.string().email().optional(),
      access_level: Ref.optional(),
      enabled: z.boolean().optional(),
      protected: z.boolean().optional(),
    },
    async (args) => {
      try {
        const data = await client.post(`/api/rest/users/`, args);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_update_user",
    "Partially update an existing user.",
    {
      user_id: z.number().int().positive(),
      name: z.string().optional(),
      real_name: z.string().optional(),
      email: z.string().email().optional(),
      access_level: Ref.optional(),
      enabled: z.boolean().optional(),
      protected: z.boolean().optional(),
    },
    async ({ user_id, ...patch }) => {
      try {
        const data = await client.patch(
          `/api/rest/users/${user_id}`,
          patch,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_user",
    "Permanently delete a user. Admin-only operation.",
    {
      user_id: z.number().int().positive(),
    },
    async ({ user_id }) => {
      try {
        const data = await client.delete(`/api/rest/users/${user_id}`);
        return jsonResult(data ?? { deleted: user_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_reset_user_password",
    "Reset a user's password. Admin-only operation; Mantis emails the new credentials.",
    {
      user_id: z.number().int().positive(),
    },
    async ({ user_id }) => {
      try {
        const data = await client.put(
          `/api/rest/users/${user_id}/reset`,
          undefined,
        );
        return jsonResult(data ?? { reset: user_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ----------- TOKENS -----------

  server.tool(
    "mantis_create_my_token",
    "Create a new API token for the authenticated user.",
    {
      name: z.string().min(1).describe("Human-readable label for the token"),
    },
    async ({ name }) => {
      try {
        const data = await client.post(`/api/rest/users/me/token`, { name });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_my_token",
    "Revoke one of the authenticated user's API tokens by token ID.",
    {
      token_id: z.number().int().positive(),
    },
    async ({ token_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/users/me/token/${token_id}`,
        );
        return jsonResult(data ?? { revoked: token_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_create_user_token",
    "Create an API token for another user. Admin-only operation.",
    {
      user_id: z.number().int().positive(),
      name: z.string().min(1),
    },
    async ({ user_id, name }) => {
      try {
        const data = await client.post(
          `/api/rest/users/${user_id}/token`,
          { name },
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_delete_user_token",
    "Revoke another user's API token. Admin-only operation.",
    {
      user_id: z.number().int().positive(),
      token_id: z.number().int().positive(),
    },
    async ({ user_id, token_id }) => {
      try {
        const data = await client.delete(
          `/api/rest/users/${user_id}/token/${token_id}`,
        );
        return jsonResult(data ?? { revoked: token_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
