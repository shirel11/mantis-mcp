# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-05-14

### Fixed
- `mantis_list_issues` was returning tool results too large for the LLM
  context budget even with pagination, because Mantis returns full nested
  enum objects (`{id, name, label, color, real_name, email, ...}`) for
  fields like `status`, `priority`, `handler`, `reporter`, `project`,
  `category` regardless of the `select` parameter.

### Changed
- In non-`full` mode, `mantis_list_issues` now post-processes each issue:
  nested ref objects are flattened to their `name` string and arrays of
  refs (e.g. `tags`) to arrays of strings. Result: a typical compact
  issue is ~300 bytes instead of ~650, so a page of 100 fits comfortably
  in LLM tool-result limits.
- Tool description for `mantis_list_issues` updated to document the
  compact format and discourage `full: true` for list calls.

## [0.1.0] - 2026-05-14

### Added
- Initial release.
- 18 read tools and 31 write tools covering the full Mantis Bug Tracker REST API
  (Issues, Issue Notes, Attachments, Projects, Sub-projects, Versions, Filters,
  Users, Tokens, Config, Lang, Pages).
- `MANTIS_MODE` env var to toggle between `read` (safe default) and `readwrite`.
- Local file attachments via `{ path }` — server reads from disk and base64-encodes.
- stdio transport for Claude Desktop / Claude Code / Cursor / other MCP clients.
- `mantis_list_issues` ships with **explicit pagination**: defaults `page=1`,
  `page_size=25` (max 100), and the response is wrapped in a `pagination`
  object exposing `has_more`, `next_page`, and a human-readable `hint` so the
  LLM knows when to fetch the next page.
- `mantis_list_issues` returns a **lightweight default projection**
  (id, summary, status, priority, severity, handler, reporter, project,
  category, sticky, created_at, updated_at) to keep responses inside LLM
  token budgets. Pass `full: true` or a custom `select` to override.
- README includes one-liner install snippets for Claude Code, Claude Desktop,
  Cursor, Gemini CLI, and VS Code.

[Unreleased]: https://github.com/shirel11/mantis-mcp/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/shirel11/mantis-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/shirel11/mantis-mcp/releases/tag/v0.1.0
