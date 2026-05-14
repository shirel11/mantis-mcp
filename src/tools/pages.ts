import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MantisClient } from "../client.js";
import { errorResult, jsonResult } from "./_helpers.js";

export function registerPageTools(server: McpServer, client: MantisClient) {
  server.tool(
    "mantis_get_issue_view_page",
    "Get the aggregated issue-view page payload for an issue (issue + related metadata as Mantis would render it).",
    {
      issue_id: z.number().int().positive(),
    },
    async ({ issue_id }) => {
      try {
        const data = await client.get(
          `/api/rest/pages/issues/view/${issue_id}`,
        );
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
