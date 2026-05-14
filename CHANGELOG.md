# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-14

### Added
- Initial release.
- 18 read tools and 31 write tools covering the full Mantis Bug Tracker REST API
  (Issues, Issue Notes, Attachments, Projects, Sub-projects, Versions, Filters,
  Users, Tokens, Config, Lang, Pages).
- `MANTIS_MODE` env var to toggle between `read` (safe default) and `readwrite`.
- Local file attachments via `{ path }` — server reads from disk and base64-encodes.
- stdio transport for Claude Desktop / Claude Code / Cursor / other MCP clients.

[Unreleased]: https://github.com/shirel11/mantis-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/shirel11/mantis-mcp/releases/tag/v0.1.0
