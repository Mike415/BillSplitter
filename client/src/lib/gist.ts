// Design: Ledger Craft — Swiss typographic fintech aesthetic
// GitHub Gist API utility: auto-sync ALL bills to a single persistent Gist

import type { BillRecord } from "./types";

const GIST_FILENAME = "bill-splitter-data.json";
const API = "https://api.github.com";

export interface GistSyncResult {
  ok: true;
  gistId: string;
  url: string;
}

export interface GistError {
  ok: false;
  error: string;
}

/** Save all bills to a single Gist. Creates one on first save, patches it thereafter. */
export async function syncBillsToGist(
  bills: BillRecord[],
  token: string,
  existingGistId?: string
): Promise<GistSyncResult | GistError> {
  if (!token) return { ok: false, error: "No GitHub token provided." };

  const content = JSON.stringify({ version: 2, bills }, null, 2);

  const payload = {
    description: "Bill Splitter — auto-sync",
    public: false,
    files: {
      [GIST_FILENAME]: { content },
    },
  };

  try {
    let res: Response;
    if (existingGistId) {
      res = await fetch(`${API}/gists/${existingGistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API}/gists`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return {
        ok: false,
        error: `GitHub API error ${res.status}: ${err.message ?? res.statusText}`,
      };
    }

    const data = await res.json() as { id: string; html_url: string };
    return { ok: true, gistId: data.id, url: data.html_url };
  } catch (e) {
    return { ok: false, error: `Network error: ${String(e)}` };
  }
}

/** Load all bills from a Gist by ID. */
export async function loadBillsFromGist(
  gistId: string,
  token?: string
): Promise<{ ok: true; bills: BillRecord[] } | GistError> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  try {
    const res = await fetch(`${API}/gists/${gistId}`, { headers });

    if (res.status === 404) return { ok: false, error: "Gist not found." };
    if (res.status === 403) return { ok: false, error: "Access denied — check your token." };
    if (!res.ok) return { ok: false, error: `GitHub API error ${res.status}: ${res.statusText}` };

    const data = await res.json() as {
      files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>;
    };

    const file = data.files[GIST_FILENAME];
    if (!file) {
      return {
        ok: false,
        error: `This Gist doesn't contain a "${GIST_FILENAME}" file.`,
      };
    }

    let content = file.content ?? "";
    if (file.truncated && file.raw_url) {
      const rawRes = await fetch(file.raw_url, { headers });
      content = await rawRes.text();
    }

    const parsed = JSON.parse(content) as { version: number; bills: BillRecord[] };
    if (!Array.isArray(parsed.bills)) {
      return { ok: false, error: "Invalid Gist format." };
    }

    return { ok: true, bills: parsed.bills };
  } catch (e) {
    return { ok: false, error: `Failed to load Gist: ${String(e)}` };
  }
}

/** Extract a Gist ID from a URL like https://gist.github.com/user/abc123 or just abc123 */
export function extractGistId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[0-9a-f]{20,40}$/i.test(trimmed)) return trimmed;
  const match = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]{20,40})/i);
  if (match) return match[1];
  return null;
}
