#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MantisClient } from "./client.js";
import { loadConfig } from "./config.js";
import { buildServer } from "./server.js";

async function main() {
  const config = loadConfig();
  const client = new MantisClient(config.url, config.token);
  const server = buildServer(client, config.mode);

  process.stderr.write(
    `[mantis-mcp] starting in '${config.mode}' mode against ${config.url}\n`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[mantis-mcp] fatal: ${msg}\n`);
  process.exit(1);
});
