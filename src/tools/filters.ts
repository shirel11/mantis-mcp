import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MantisClient } from "../client.js";
import type { Mode } from "../config.js";
import { errorResult, jsonResult } from "./_helpers.js";

export function registerFilterTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  server.tool(
    "mantis_list_filters",
    "List all saved filters visible to the authenticated user.",
    {},
    async () => {
      try {
        const data = await client.get(`/api/rest/filters`);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    "mantis_get_filter",
    "Get a single saved filter by ID.",
    {
      filter_id: z.number().int().positive(),
    },
    async ({ filter_id }) => {
      try {
        const data = await client.get(`/api/rest/filters/${filter_id}`);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  if (mode !== "readwrite") return;

  server.tool(
    "mantis_delete_filter",
    "Delete a saved filter.",
    {
      filter_id: z.number().int().positive(),
    },
    async ({ filter_id }) => {
      try {
        const data = await client.delete(`/api/rest/filters/${filter_id}`);
        return jsonResult(data ?? { deleted: filter_id });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
