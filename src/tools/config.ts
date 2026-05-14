import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MantisClient } from "../client.js";
import type { Mode } from "../config.js";
import { Ref, errorResult, jsonResult } from "./_helpers.js";

export function registerConfigTools(
  server: McpServer,
  client: MantisClient,
  mode: Mode,
) {
  server.tool(
    "mantis_get_config",
    "Get one or more Mantis configuration option values by name.",
    {
      option: z
        .union([z.string(), z.array(z.string()).min(1)])
        .describe(
          "Single config option name, or an array of option names to fetch in one call",
        ),
    },
    async ({ option }) => {
      try {
        const data = Array.isArray(option)
          ? await client.get(`/api/rest/config`, { option })
          : await client.get(`/api/rest/config`, { option });
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  if (mode !== "readwrite") return;

  server.tool(
    "mantis_set_config",
    "Set one or more Mantis configuration options. If `project` is provided the config is scoped to that project, otherwise global.",
    {
      configs: z
        .array(
          z.object({
            option: z.string(),
            value: z.unknown(),
          }),
        )
        .min(1),
      project: Ref.optional(),
      user: Ref.optional(),
    },
    async ({ configs, project, user }) => {
      try {
        const body: Record<string, unknown> = { configs };
        if (project) body.project = project;
        if (user) body.user = user;
        const data = await client.patch(`/api/rest/config`, body);
        return jsonResult(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
