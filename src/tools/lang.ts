import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MantisClient } from "../client.js";
import { errorResult, jsonResult } from "./_helpers.js";

export function registerLangTools(server: McpServer, client: MantisClient) {
  server.tool(
    "mantis_get_lang",
    "Get one or more localized strings from Mantis (uses the authenticated user's language).",
    {
      string: z
        .union([z.string(), z.array(z.string()).min(1)])
        .describe(
          "Single string key, or an array of keys to fetch in one call",
        ),
    },
    async ({ string }) => {
      try {
        const data = await client.get(`/api/rest/lang`, { string });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
