// Design: Ledger Craft — Swiss typographic fintech aesthetic
// GistDialog: configure GitHub token + Gist ID for auto-sync

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import { extractGistId, loadBillsFromGist } from "@/lib/gist";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Github,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cloud,
  CloudOff,
} from "lucide-react";
import { toast } from "sonner";

interface GistDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function GistDialog({ open, onClose }: GistDialogProps) {
  const { gistSettings, saveGistSettings, bills, replaceBills } = useBills();

  const [token, setToken] = useState(gistSettings.token);
  const [gistIdInput, setGistIdInput] = useState(gistSettings.gistId ?? "");
  const [showToken, setShowToken] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    const trimmedToken = token.trim();
    const trimmedGistId = gistIdInput.trim()
      ? extractGistId(gistIdInput.trim()) ?? gistIdInput.trim()
      : undefined;

    saveGistSettings({ token: trimmedToken, gistId: trimmedGistId });
    toast.success("Gist settings saved", {
      description: trimmedToken
        ? "Your bills will auto-sync to GitHub Gist."
        : "Auto-sync disabled (no token).",
    });
    onClose();
  };

  const handleLoadFromGist = async () => {
    const gistId = gistIdInput.trim() ? extractGistId(gistIdInput.trim()) : null;
    if (!gistId) {
      setLoadError("Enter a valid Gist ID or URL first.");
      return;
    }
    setLoading(true);
    setLoadError("");
    const result = await loadBillsFromGist(gistId, token.trim() || undefined);
    setLoading(false);
    if (result.ok) {
      replaceBills(result.bills);
      saveGistSettings({ token: token.trim(), gistId });
      toast.success(`Loaded ${result.bills.length} bill${result.bills.length !== 1 ? "s" : ""} from Gist`);
      onClose();
    } else {
      setLoadError(result.error);
    }
  };

  const isConfigured = !!gistSettings.token;
  const hasGistId = !!gistSettings.gistId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Gist Sync
          </DialogTitle>
          <DialogDescription>
            All your bills auto-save to a single private Gist whenever you make changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status banner */}
          {isConfigured ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Auto-sync active</p>
                <p className="text-[11px] text-emerald-700">
                  {hasGistId
                    ? `Syncing to Gist ${gistSettings.gistId!.slice(0, 8)}…`
                    : `${bills.length} bill${bills.length !== 1 ? "s" : ""} will sync on next change`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-muted/40">
              <CloudOff className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Enter a token below to enable auto-sync.
              </p>
            </div>
          )}

          {/* Token */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              GitHub Personal Access Token
            </Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Needs <code className="bg-muted px-1 rounded text-[10px]">gist</code> scope.{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Bill+Splitter"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Create one on GitHub ↗
              </a>
            </p>
          </div>

          {/* Optional: restore from existing Gist */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Restore from Existing Gist{" "}
              <span className="normal-case font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://gist.github.com/… or Gist ID"
                value={gistIdInput}
                onChange={(e) => { setGistIdInput(e.target.value); setLoadError(""); }}
                className="font-mono text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadFromGist}
                disabled={loading || !gistIdInput.trim()}
                className="shrink-0 gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Load
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste a Gist URL or ID to pull bills from a previous session or another device.
            </p>
            {loadError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{loadError}</p>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              How auto-sync works
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-5 list-disc">
              <li>All {bills.length} bill{bills.length !== 1 ? "s" : ""} save to one private Gist automatically</li>
              <li>Changes sync 2 seconds after you stop editing</li>
              <li>Paste the Gist ID on another device to restore everything</li>
              <li>Token is stored in your browser only — never sent anywhere else</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSave}>
              <Cloud className="w-4 h-4" />
              {isConfigured ? "Update Settings" : "Enable Auto-Sync"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
