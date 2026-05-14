import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MantisClient } from "./client.js";
import type { Mode } from "./config.js";
import { registerConfigTools } from "./tools/config.js";
import { registerFilterTools } from "./tools/filters.js";
import { registerIssueNoteTools } from "./tools/issueNotes.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerLangTools } from "./tools/lang.js";
import { registerPageTools } from "./tools/pages.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerUserTools } from "./tools/users.js";

export function buildServer(client: MantisClient, mode: Mode): McpServer {
  const server = new McpServer({
    name: "mantis-mcp",
    version: "0.1.0",
  });

  registerIssueTools(server, client, mode);
  registerIssueNoteTools(server, client, mode);
  registerProjectTools(server, client, mode);
  registerFilterTools(server, client, mode);
  registerUserTools(server, client, mode);
  registerConfigTools(server, client, mode);
  registerLangTools(server, client);
  registerPageTools(server, client);

  return server;
}
