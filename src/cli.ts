#!/usr/bin/env node

import { fetchTree, fetchDoc, normalizePath } from "./api.js";
import { renderTree, searchTree, filterSubtree } from "./tree.js";

function usage(): void {
  console.log(`feishu-doc - Read Feishu Open Platform docs as Markdown

Usage:
  feishu-doc read <path>          Read a document
  feishu-doc tree [path]          Show document tree
  feishu-doc search <keyword>     Search document titles

Options:
  --lang zh|en    Language (default: zh)
  --depth <n>     Tree display depth limit

Path formats (all accepted by 'read'):
  /home/intro
  /ssl:ttdoc/ukTMukTMukTM/uMTNz4yM1MjLzUzM
  /document/client-docs/intro
  https://open.feishu.cn/document/client-docs/intro
  https://open.larkoffice.com/document/client-docs/bot-v3/bot-overview

Tip: Any link href found in document content can be passed directly to 'read'.`);
  process.exit(0);
}

function parseArgs(argv: string[]) {
  const args: string[] = [];
  let lang = "zh";
  let depth = Infinity;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--lang" && argv[i + 1]) {
      lang = argv[++i];
    } else if (argv[i] === "--depth" && argv[i + 1]) {
      const n = parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n > 0) depth = n;
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      usage();
    } else {
      args.push(argv[i]);
    }
  }

  return { args, lang, depth };
}

async function cmdRead(path: string, lang: string) {
  const doc = await fetchDoc(path, lang);
  const date = new Date(doc.updateTime).toISOString().slice(0, 10);

  console.log(`# ${doc.name}\n`);
  console.log(`> Path: ${doc.fullPath}`);
  console.log(`> Updated: ${date}\n`);
  console.log("---\n");
  console.log(doc.content);
}

async function cmdTree(lang: string, depth: number, path?: string) {
  const tree = await fetchTree(lang);
  const match = path ? filterSubtree(tree, normalizePath(path)) : null;
  if (path && !match) {
    console.error(`Path not found in tree: ${path}`);
    process.exit(1);
    return;
  }
  // When filtering by path, render children of the matched node directly
  // so --depth 1 shows its immediate children (not the node itself).
  const nodes = match ? match[0].items : tree;
  if (match && nodes.length === 0) {
    // Leaf node — show the node itself
    console.log(renderTree(match, depth));
  } else {
    console.log(renderTree(nodes, depth));
  }
}

async function cmdSearch(keyword: string, lang: string) {
  const tree = await fetchTree(lang);
  const results = searchTree(tree, keyword);
  if (results.length === 0) {
    console.log(`No documents found matching "${keyword}"`);
    return;
  }
  console.log(`Found ${results.length} document(s):\n`);
  for (const r of results) {
    console.log(`  ${r.name}`);
    console.log(`    feishu-doc read "${r.fullPath}"\n`);
  }
}

async function main() {
  const { args, lang, depth } = parseArgs(process.argv.slice(2));
  const command = args[0];

  if (!command) usage();

  switch (command) {
    case "read": {
      const path = args[1];
      if (!path) {
        console.error("Error: missing <path>\nUsage: feishu-doc read <path>");
        process.exit(1);
      }
      await cmdRead(path, lang);
      break;
    }
    case "tree": {
      await cmdTree(lang, depth, args[1]);
      break;
    }
    case "search": {
      const keyword = args[1];
      if (!keyword) {
        console.error("Error: missing <keyword>\nUsage: feishu-doc search <keyword>");
        process.exit(1);
      }
      await cmdSearch(keyword, lang);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      usage();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
