const BASE = "https://open.feishu.cn";

export interface TreeNode {
  name: string;
  fullPath: string;
  type: "DirectoryType" | "DocumentType";
  id: string;
  parentId: string;
  items: TreeNode[];
}

export interface Doc {
  name: string;
  content: string;
  fullPath: string;
  updateTime: number;
}

/**
 * Normalize any link format found in Feishu docs to an API-usable fullPath.
 *
 * Accepted inputs:
 *   /ssl:ttdoc/xxx                           → /xxx
 *   https://open.feishu.cn/document/xxx      → /xxx
 *   https://open.larkoffice.com/document/xxx → /xxx
 *   /document/xxx                            → /xxx
 *   /xxx                                     → /xxx  (passthrough)
 */
export function normalizePath(input: string): string {
  let p = input.trim();

  // Strip URL with anchor — keep only the path part
  // e.g. https://open.feishu.cn/document/xxx#anchor → /xxx
  for (const domain of [
    "https://open.feishu.cn",
    "https://open.larkoffice.com",
  ]) {
    if (p.startsWith(domain)) {
      try {
        p = new URL(p).pathname;
      } catch {
        // Malformed URL — strip the domain prefix as fallback
        p = p.slice(domain.length);
      }
      break;
    }
  }

  // /ssl:ttdoc/xxx → /xxx
  if (p.startsWith("/ssl:ttdoc/")) {
    p = p.slice("/ssl:ttdoc".length);
  }

  // /document/xxx → /xxx
  if (p.startsWith("/document/")) {
    p = p.slice("/document".length);
  }

  // Strip anchor and query string (e.g. /path#anchor or /path?foo=bar)
  const hashIdx = p.indexOf("#");
  if (hashIdx !== -1) p = p.slice(0, hashIdx);
  const qIdx = p.indexOf("?");
  if (qIdx !== -1) p = p.slice(0, qIdx);

  // Ensure leading slash
  if (!p.startsWith("/")) {
    p = "/" + p;
  }

  return p;
}

function headers(lang: string): Record<string, string> {
  const locale = lang === "en" ? "en-US" : "zh-CN";
  return { Cookie: `open_locale=${locale}` };
}

export async function fetchTree(lang: string): Promise<TreeNode[]> {
  const res = await fetch(`${BASE}/api/tools/docment/directory_list`, {
    headers: headers(lang),
  });
  const json = (await res.json()) as { code: number; data?: { items: TreeNode[] } };
  if (json.code !== 0 || !json.data) throw new Error(`API error: code ${json.code}`);
  return json.data.items;
}

export async function fetchDoc(path: string, lang: string): Promise<Doc> {
  const fullPath = normalizePath(path);
  const url = `${BASE}/document_portal/v1/document/get_detail?fullPath=${encodeURIComponent(fullPath)}`;
  const res = await fetch(url, { headers: headers(lang) });
  const json = (await res.json()) as {
    code: number;
    msg?: string;
    data?: {
      name: string;
      content: string;
      fullPath: string;
      updateTime: number;
    };
  };
  if (json.code !== 0 || !json.data) {
    throw new Error(`API error: ${json.msg || `code ${json.code}`} (fullPath: ${fullPath})`);
  }
  return json.data;
}
