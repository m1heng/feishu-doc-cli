# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
pnpm install        # install deps
pnpm run build      # tsc → dist/
node dist/cli.js read /home/intro   # run locally
```

No test suite yet. Verify changes manually with the three commands:
```bash
feishu-doc tree --depth 2
feishu-doc read /home/intro
feishu-doc search "消息"
```

## Architecture

A thin CLI wrapper over two unauthenticated Feishu Open Platform APIs. Zero runtime dependencies.

**3 source files, single data flow:**

```
cli.ts (argv parsing, command dispatch)
  → api.ts (normalizePath + HTTP fetch)
  → tree.ts (render/search/filter on TreeNode[])
```

- `api.ts` — `normalizePath()` is the SSOT for converting any link format to an API fullPath. `fetchTree()` and `fetchDoc()` call the two Feishu endpoints. Language is controlled via `Cookie: open_locale=zh-CN|en-US`.
- `tree.ts` — Pure functions operating on `TreeNode[]`. No I/O.
- `cli.ts` — Entry point. Manual argv parsing (no framework). `read` outputs a metadata header then the raw Markdown content unchanged.

**Key design decision:** Document content is output verbatim — no link rewriting. Instead, `normalizePath` accepts all link formats (`/ssl:ttdoc/...`, full URLs, `/document/...`) so users can copy any href from content and pass it directly to `feishu-doc read`.

## Feishu API Reference

| Endpoint | Returns |
|----------|---------|
| `GET /api/tools/docment/directory_list` | Full nested doc tree (~925KB) |
| `GET /document_portal/v1/document/get_detail?fullPath=<path>` | Single doc with Markdown `content` |

## Link Formats in Documents

Documents contain internal links in these formats — all handled by `normalizePath`:

- `/ssl:ttdoc/xxx` → strip prefix
- `https://open.feishu.cn/document/xxx` → extract pathname, strip `/document`
- `https://open.larkoffice.com/document/xxx` → same
- `/document/xxx` → strip `/document`
