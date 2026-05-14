# @shirelshitrit/mantis-mcp

[![npm version](https://img.shields.io/npm/v/@shirelshitrit/mantis-mcp.svg)](https://www.npmjs.com/package/@shirelshitrit/mantis-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@shirelshitrit/mantis-mcp.svg)](https://www.npmjs.com/package/@shirelshitrit/mantis-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@shirelshitrit/mantis-mcp.svg)](https://nodejs.org)

An **MCP (Model Context Protocol)** server that exposes the [Mantis Bug Tracker](https://www.mantisbt.org/) REST API as tools an LLM client (Claude Desktop, Claude Code, Cursor, etc.) can call.

Lets your AI assistant **read** issues / projects / users **and optionally write** — create issues, post notes, attach files, manage projects, all from natural-language prompts.

Built directly from the official [Mantis Bug Tracker Postman collection](https://documenter.getpostman.com/view/29959/SVtVViMv).

---

## Prerequisites

- Node.js ≥ 18 (with `npx` available — bundled with npm).
- A Mantis Bug Tracker instance and an **API token**. Generate one in Mantis: *My Account → API Tokens → Create*.

Replace `https://your-instance.mantishub.io` and `your-api-token` in the snippets below with your real values. Switch `MANTIS_MODE=read` → `MANTIS_MODE=readwrite` when you want write operations enabled.

---

## MCP Client Configuration

### Claude Code

```bash
claude mcp add mantis --scope user \
  -e MANTIS_URL=https://your-instance.mantishub.io \
  -e MANTIS_TOKEN=your-api-token \
  -e MANTIS_MODE=read \
  -- npx -y @shirelshitrit/mantis-mcp@latest
```

Verify with `claude mcp list`. Restart Claude Code so the new server is picked up.

### Claude Desktop

Edit `claude_desktop_config.json`:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mantis": {
      "command": "npx",
      "args": ["-y", "@shirelshitrit/mantis-mcp@latest"],
      "env": {
        "MANTIS_URL": "https://your-instance.mantishub.io",
        "MANTIS_TOKEN": "your-api-token",
        "MANTIS_MODE": "read"
      }
    }
  }
}
```

Quit Claude Desktop completely (from the tray, not just the window) and reopen.

### Cursor

Edit `~/.cursor/mcp.json` (or *Settings → MCP → Add new MCP server*):

```json
{
  "mcpServers": {
    "mantis": {
      "command": "npx",
      "args": ["-y", "@shirelshitrit/mantis-mcp@latest"],
      "env": {
        "MANTIS_URL": "https://your-instance.mantishub.io",
        "MANTIS_TOKEN": "your-api-token",
        "MANTIS_MODE": "read"
      }
    }
  }
}
```

### Gemini CLI

```bash
gemini mcp add mantis \
  -e MANTIS_URL=https://your-instance.mantishub.io \
  -e MANTIS_TOKEN=your-api-token \
  -e MANTIS_MODE=read \
  -- npx -y @shirelshitrit/mantis-mcp@latest
```

### VS Code (GitHub Copilot Chat / agents)

```bash
code --add-mcp '{"name":"mantis","command":"npx","args":["-y","@shirelshitrit/mantis-mcp@latest"],"env":{"MANTIS_URL":"https://your-instance.mantishub.io","MANTIS_TOKEN":"your-api-token","MANTIS_MODE":"read"}}'
```

Or edit `.vscode/mcp.json` in your workspace.

### Codex CLI / other JSON-config clients

Add to your client's MCP config file (path varies by client) using the same JSON shape shown in the Claude Desktop section above.

---

## Switching modes

To enable write operations (create/update/delete issues, projects, users, attachments, etc.) change `MANTIS_MODE` from `read` to `readwrite` in your config, then restart the client. In `read` mode the LLM cannot see write tools at all — strongest safety guarantee.

---

## Features

- **49 tools** covering Issues, Notes, Projects, Sub-projects, Versions, Filters, Users, Tokens, Config, Lang, and Pages.
- **Two access modes** controlled by a single env var:
  - `read` (default) — only `GET` endpoints are registered. Safe to point at production.
  - `readwrite` — adds `POST` / `PATCH` / `PUT` / `DELETE` endpoints.
- **stdio transport** — works out of the box with every major MCP client.
- **Local file attachments** — pass `{ path: "..." }` and the server reads and base64-encodes the file before posting.
- **Zero config files** — base URL, API token, and mode all come from env vars.

---

## Alternative install methods

The CLI snippets above use `npx -y` so the latest version is fetched on demand. If you prefer not to use `npx`:

### Global install

```bash
npm install -g @shirelshitrit/mantis-mcp
```

Then in your client config replace `"command": "npx", "args": ["-y", "@shirelshitrit/mantis-mcp@latest"]` with `"command": "mantis-mcp", "args": []`.

### Local clone (for development)

```bash
git clone https://github.com/shirel11/mantis-mcp.git
cd mantis-mcp
npm install
npm run build
```

Then use `"command": "node"`, `"args": ["/absolute/path/to/dist/index.js"]`.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MANTIS_URL` | Yes | — | Base URL of your Mantis instance, e.g. `https://my-instance.mantishub.io`. Trailing slashes are stripped. |
| `MANTIS_TOKEN` | Yes | — | Raw API token. Sent as the `Authorization` header (no `Bearer ` prefix — Mantis expects the token verbatim). |
| `MANTIS_MODE` | No | `read` | Either `read` or `readwrite`. |

The server itself does **not** load `.env` — env vars are passed by whatever spawns the process (MCP client config, your shell, etc.).

---

## Testing before connecting to an LLM

Use the official **MCP Inspector** to invoke tools manually and see real responses:

```bash
npx @modelcontextprotocol/inspector npx -y @shirelshitrit/mantis-mcp
```

(Set `MANTIS_URL`, `MANTIS_TOKEN`, `MANTIS_MODE` in your shell first.)

Try `mantis_get_my_user` — if it returns your user, the token and URL are correct.

---

## Tool reference

### Read tools — 18 (always available)

| Tool | Purpose |
|---|---|
| `mantis_get_issue` | Get one issue by ID |
| `mantis_list_issues` | List issues with optional `project_id`, `filter_id` (`assigned` / `reported` / `monitored` / `unassigned` or numeric), `page`, `page_size`, `select` |
| `mantis_get_issue_files` | List attachments on an issue |
| `mantis_get_issue_file` | Get one attachment |
| `mantis_list_projects` | All projects visible to caller |
| `mantis_get_project` | One project by ID |
| `mantis_list_project_users` | Users assigned to a project |
| `mantis_list_project_handlers` | Users who can be assigned issues |
| `mantis_list_project_versions` | Versions of a project |
| `mantis_get_project_version` | One version by ID |
| `mantis_list_filters` | All saved filters |
| `mantis_get_filter` | One filter by ID |
| `mantis_get_my_user` | Authenticated user info |
| `mantis_get_user` | One user by ID |
| `mantis_get_user_by_username` | One user by username |
| `mantis_get_config` | One or more Mantis config option values |
| `mantis_get_lang` | One or more localized strings |
| `mantis_get_issue_view_page` | Aggregated issue-view payload |

### Write tools — 31 (only when `MANTIS_MODE=readwrite`)

**Issues:** `mantis_create_issue`, `mantis_update_issue`, `mantis_delete_issue`, `mantis_monitor_issue`, `mantis_add_issue_tags`, `mantis_remove_issue_tag`, `mantis_add_issue_relationship`, `mantis_delete_issue_relationship`

**Notes & attachments:** `mantis_create_issue_note`, `mantis_delete_issue_note`, `mantis_add_issue_attachments`

**Projects:** `mantis_create_project`, `mantis_update_project`, `mantis_delete_project`, `mantis_create_project_version`, `mantis_update_project_version`, `mantis_delete_project_version`, `mantis_add_subproject`, `mantis_update_subproject`, `mantis_set_project_user`, `mantis_remove_project_user`

**Filters:** `mantis_delete_filter`

**Users:** `mantis_create_user`, `mantis_update_user`, `mantis_delete_user`, `mantis_reset_user_password`

**Tokens:** `mantis_create_my_token`, `mantis_delete_my_token`, `mantis_create_user_token`, `mantis_delete_user_token`

**Config:** `mantis_set_config`

### Conventions

- **Nested references** (project / category / handler / tag / status / priority / severity / view_state / resolution / access_level) accept `{ id: number }`, `{ name: string }`, or both. At least one must be present.
- **Attachments** (`mantis_create_issue`, `mantis_create_issue_note`, `mantis_add_issue_attachments`) take `files: [{ path, name? }]`. Each path is read from disk and base64-encoded before posting. `name` defaults to the file's basename.

---

## Example prompts

Once wired into your LLM client:

- *"List my assigned issues from Mantis."* → `mantis_list_issues({ filter_id: "assigned" })`
- *"Show me issue 1234 with only id, summary, status."* → `mantis_get_issue({ issue_id: 1234, select: "id,summary,status" })`
- *"Create a bug in project 'mantisbt' with summary 'login fails on iOS' and severity 'major'."* → `mantis_create_issue({...})` (requires `readwrite`)
- *"Attach the file /screenshots/error.png to issue 1234."* → `mantis_add_issue_attachments({...})`

---

## Security notes

- **Mode matters.** Run with `MANTIS_MODE=read` against production unless you specifically need writes — even with read+write, an LLM that hallucinates a delete request will permanently destroy data.
- **Token scope.** Mantis API tokens inherit the access level of the user who created them. Create a dedicated, least-privilege user for the LLM where possible.
- **No telemetry.** This server makes only the HTTP calls the tools dictate. It does not phone home.

---

## Development

```bash
git clone https://github.com/shirel11/mantis-mcp.git
cd mantis-mcp
npm install

# Run from sources (tsx, no build step)
$env:MANTIS_URL="https://your-instance.mantishub.io"
$env:MANTIS_TOKEN="your-token"
$env:MANTIS_MODE="read"
npm run dev
```

Output goes to **stderr** (stdout is reserved for the JSON-RPC protocol).

### Project structure

```
src/
├── index.ts          # entrypoint — loads env, builds server, connects stdio
├── config.ts         # env var validation (Zod)
├── client.ts         # MantisClient — fetch wrapper + base64 attachment helper
├── server.ts         # buildServer(client, mode) — registers all tool modules
└── tools/
    ├── _helpers.ts   # shared Zod schemas (Ref, AttachmentInput) + result helpers
    ├── issues.ts
    ├── issueNotes.ts
    ├── projects.ts
    ├── filters.ts
    ├── users.ts
    ├── config.ts
    ├── lang.ts
    └── pages.ts
```

Each `tools/*.ts` exports a `register(server, client, mode)` function. Read tools register unconditionally; write tools gate on `if (mode === 'readwrite')`.

---

## Contributing

Issues and pull requests welcome — see [issues](https://github.com/shirel11/mantis-mcp/issues).

---

## License

[MIT](./LICENSE) © Shirel Shitrit
