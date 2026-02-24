# feishu-doc-cli

CLI tool to read [Feishu Open Platform](https://open.feishu.cn) documentation as Markdown.

Feishu developer docs live behind a SPA that AI coding agents cannot read directly. This tool exposes the docs through a simple CLI, outputting raw Markdown that agents (and humans) can consume.

## Install

```bash
npm install -g feishu-doc-cli
```

Requires Node.js >= 18.

### As an AI agent skill

```bash
npx skills add m1heng/feishu-doc-cli
```

Once installed, agents like Claude Code will automatically use `feishu-doc` when you ask about Feishu/Lark APIs.

## Usage

### Read a document

```bash
feishu-doc read /home/intro
```

Output:

```markdown
# 开放平台概述

> Path: /home/intro
> Updated: 2025-11-28

---

(original Markdown content)
```

### Browse the document tree

```bash
feishu-doc tree --depth 2
```

```
├── 📁 文档首页
│   └── 📄 首页  → /home/index
├── 📁 开发指南
│   ├── 📁 平台简介
│   ├── 📁 开发流程
│   ...
```

Filter to a subtree:

```bash
feishu-doc tree "/uAjLw4CM/uYjL24iN/platform-overveiw" --depth 3
```

### Search documents by title

```bash
feishu-doc search "消息"
```

```
Found 109 document(s):

  发送消息
    feishu-doc read "/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/create"
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--lang zh\|en` | Language | `zh` |
| `--depth <n>` | Tree display depth | unlimited |

## Following links

Documents contain links in various formats. **All of them work directly with `feishu-doc read`** — just copy the `href` value from any link in the content:

```bash
# /ssl:ttdoc/ links (most common in content)
feishu-doc read "/ssl:ttdoc/ukTMukTMukTM/uMTNz4yM1MjLzUzM"

# Full Feishu URLs
feishu-doc read "https://open.feishu.cn/document/client-docs/intro"

# Full Lark URLs
feishu-doc read "https://open.larkoffice.com/document/client-docs/bot-v3/bot-overview"

# /document/ paths
feishu-doc read "/document/client-docs/intro"

# API fullPath (as shown in tree output)
feishu-doc read "/home/intro"
```

The CLI normalizes all formats internally, including anchors (`#section`) and query strings. No need to manually convert.

## How it works

Feishu Open Platform exposes two public APIs (no authentication required):

| API | Purpose |
|-----|---------|
| `GET /api/tools/docment/directory_list` | Full document tree (~925 KB JSON) |
| `GET /document_portal/v1/document/get_detail?fullPath=<path>` | Document content in Markdown |

This CLI is a thin wrapper around these two endpoints.

## License

MIT
