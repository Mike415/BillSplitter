// Design: Ledger Craft — Swiss typographic fintech aesthetic
// GitHub Gist API utility: save and load bills as Gists

import type { BillState } from "./types";

const GIST_FILENAME = "bill-splitter.json";
const API = "https://api.github.com";

export interface GistSaveResult {
  ok: true;
  gistId: string;
  url: string;
  rawUrl: string;
}

export interface GistError {
  ok: false;
  error: string;
}

/** Save a bill as a secret GitHub Gist. Returns the Gist ID and URL. */
export async function saveBillToGist(
  bill: BillState,
  token: string,
  existingGistId?: string
): Promise<GistSaveResult | GistError> {
  if (!token) return { ok: false, error: "No GitHub token provided." };

  const body = JSON.stringify(
    { version: 1, bill },
    null,
    2
  );

  const payload = {
    description: `Bill Splitter — ${bill.title}`,
    public: false,
    files: {
      [GIST_FILENAME]: { content: body },
    },
  };

  try {
    let res: Response;
    if (existingGistId) {
      // PATCH to update existing Gist
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
      // POST to create new Gist
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
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: `GitHub API error ${res.status}: ${(err as { message?: string }).message ?? res.statusText}`,
      };
    }

    const data = await res.json() as {
      id: string;
      html_url: string;
      files: Record<string, { raw_url: string }>;
    };

    return {
      ok: true,
      gistId: data.id,
      url: data.html_url,
      rawUrl: data.files[GIST_FILENAME]?.raw_url ?? "",
    };
  } catch (e) {
    return { ok: false, error: `Network error: ${String(e)}` };
  }
}

/** Load a bill from a GitHub Gist by ID or URL. */
export async function loadBillFromGist(
  gistIdOrUrl: string,
  token?: string
): Promise<{ ok: true; bill: BillState; gistId: string } | GistError> {
  // Extract Gist ID from URL if needed
  const gistId = extractGistId(gistIdOrUrl);
  if (!gistId) {
    return { ok: false, error: "Invalid Gist ID or URL. Expected a GitHub Gist URL or a 32-character Gist ID." };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  try {
    const res = await fetch(`${API}/gists/${gistId}`, { headers });

    if (res.status === 404) {
      return { ok: false, error: "Gist not found. Check the ID/URL and make sure it's accessible." };
    }
    if (res.status === 403) {
      return { ok: false, error: "Access denied. The Gist may be private — provide a GitHub token to access it." };
    }
    if (!res.ok) {
      return { ok: false, error: `GitHub API error ${res.status}: ${res.statusText}` };
    }

    const data = await res.json() as {
      files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>;
    };

    const file = data.files[GIST_FILENAME];
    if (!file) {
      return {
        ok: false,
        error: `This Gist doesn't contain a "${GIST_FILENAME}" file. Make sure it was saved by Bill Splitter.`,
      };
    }

    // If content is truncated, fetch raw URL
    let content = file.content ?? "";
    if (file.truncated && file.raw_url) {
      const rawRes = await fetch(file.raw_url, { headers });
      content = await rawRes.text();
    }

    const parsed = JSON.parse(content) as { version: number; bill: BillState };
    if (!parsed.bill || !parsed.bill.title) {
      return { ok: false, error: "The Gist content doesn't look like a valid Bill Splitter export." };
    }

    return { ok: true, bill: parsed.bill, gistId };
  } catch (e) {
    return { ok: false, error: `Failed to load Gist: ${String(e)}` };
  }
}

/** Extract a Gist ID from a URL like https://gist.github.com/user/abc123 or just abc123 */
function extractGistId(input: string): string | null {
  const trimmed = input.trim();
  // Already a raw ID (hex, 20-32 chars)
  if (/^[0-9a-f]{20,40}$/i.test(trimmed)) return trimmed;
  // URL: https://gist.github.com/username/ID or https://gist.github.com/ID
  const match = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]{20,40})/i);
  if (match) return match[1];
  return null;
}
