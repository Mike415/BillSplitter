// Design: Ledger Craft — Swiss typographic fintech aesthetic
// GistDialog: save bill to / load bill from GitHub Gist

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import { saveBillToGist, loadBillFromGist } from "@/lib/gist";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Github,
  Save,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface GistDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function GistDialog({ open, onClose }: GistDialogProps) {
  const { activeBill, activeId, gistSettings, saveGistSettings, setGistId, importBill, bills } =
    useBills();
  const activeRecord = bills.find((b) => b.id === activeId);

  const [token, setToken] = useState(gistSettings.token);
  const [showToken, setShowToken] = useState(false);
  const [loadUrl, setLoadUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<{ url: string; gistId: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleSaveToken = () => {
    saveGistSettings({ token: token.trim() });
    toast.success("Token saved");
  };

  const handleSave = async () => {
    if (!token.trim()) {
      setSaveError("Enter a GitHub personal access token first.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveResult(null);

    const result = await saveBillToGist(
      activeBill,
      token.trim(),
      activeRecord?.gistId
    );

    setSaving(false);
    if (result.ok) {
      setGistId(activeId, result.gistId);
      setSaveResult({ url: result.url, gistId: result.gistId });
      toast.success(activeRecord?.gistId ? "Gist updated" : "Saved to Gist", {
        description: activeBill.title,
      });
    } else {
      setSaveError(result.error);
    }
  };

  const handleLoad = async () => {
    if (!loadUrl.trim()) {
      setLoadError("Enter a Gist ID or URL.");
      return;
    }
    setLoading(true);
    setLoadError("");

    const result = await loadBillFromGist(loadUrl.trim(), token.trim() || undefined);

    setLoading(false);
    if (result.ok) {
      importBill(result.bill);
      setGistId(activeId, result.gistId);
      toast.success("Bill loaded from Gist", { description: result.bill.title });
      onClose();
    } else {
      setLoadError(result.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Gist
          </DialogTitle>
          <DialogDescription>
            Save your bill as a private GitHub Gist or load one by URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Personal Access Token
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <Button variant="outline" size="sm" onClick={handleSaveToken} className="shrink-0">
                Save
              </Button>
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

          <Tabs defaultValue="save">
            <TabsList className="w-full">
              <TabsTrigger value="save" className="flex-1 gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save
              </TabsTrigger>
              <TabsTrigger value="load" className="flex-1 gap-1.5">
                <Download className="w-3.5 h-3.5" /> Load
              </TabsTrigger>
            </TabsList>

            {/* ── Save tab ── */}
            <TabsContent value="save" className="space-y-3 mt-3">
              <div className="rounded-lg border border-border px-3 py-2.5 space-y-1">
                <p className="text-xs font-medium">{activeBill.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {activeBill.people.length} people · {activeBill.expenses.length} expenses
                </p>
                {activeRecord?.gistId && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Linked to Gist{" "}
                    <code className="font-mono text-[10px]">{activeRecord.gistId.slice(0, 8)}…</code>
                  </p>
                )}
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg border border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{saveError}</p>
                </div>
              )}

              {saveResult && (
                <div className="space-y-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-800">Saved successfully</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono text-emerald-700 flex-1 truncate">
                      {saveResult.url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(saveResult.url)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={saveResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : activeRecord?.gistId ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving
                  ? "Saving…"
                  : activeRecord?.gistId
                  ? "Update Gist"
                  : "Save to New Gist"}
              </Button>
            </TabsContent>

            {/* ── Load tab ── */}
            <TabsContent value="load" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Gist URL or ID
                </Label>
                <Input
                  placeholder="https://gist.github.com/user/abc123… or abc123…"
                  value={loadUrl}
                  onChange={(e) => { setLoadUrl(e.target.value); setLoadError(""); }}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste a Gist URL or the raw Gist ID. Private Gists require a token.
                </p>
              </div>

              {loadError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg border border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{loadError}</p>
                </div>
              )}

              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-100 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This will <strong>replace</strong> the current bill with the Gist contents.
                </p>
              </div>

              <Button
                onClick={handleLoad}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {loading ? "Loading…" : "Load from Gist"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
