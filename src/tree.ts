import type { TreeNode } from "./api.js";

export function renderTree(
  nodes: TreeNode[],
  maxDepth: number = Infinity,
  depth: number = 0,
  prefix: string = "",
): string {
  if (depth >= maxDepth) return "";
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const isDir = node.type === "DirectoryType";
    const icon = isDir ? "📁" : "📄";
    const pathHint = isDir ? "" : `  → ${node.fullPath}`;

    lines.push(`${prefix}${connector}${icon} ${node.name}${pathHint}`);

    if (node.items.length > 0) {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      const sub = renderTree(node.items, maxDepth, depth + 1, childPrefix);
      if (sub) lines.push(sub);
    }
  }

  return lines.join("\n");
}

export function searchTree(
  nodes: TreeNode[],
  keyword: string,
): { name: string; fullPath: string }[] {
  const results: { name: string; fullPath: string }[] = [];
  const kw = keyword.toLowerCase();

  function walk(items: TreeNode[]) {
    for (const node of items) {
      if (
        node.type === "DocumentType" &&
        node.name.toLowerCase().includes(kw)
      ) {
        results.push({ name: node.name, fullPath: node.fullPath });
      }
      if (node.items.length > 0) walk(node.items);
    }
  }

  walk(nodes);
  return results;
}

export function filterSubtree(
  nodes: TreeNode[],
  path: string,
): TreeNode[] | null {
  for (const node of nodes) {
    if (node.fullPath === path) return [node];
    if (node.items.length > 0) {
      const found = filterSubtree(node.items, path);
      if (found) return found;
    }
  }
  return null;
}
