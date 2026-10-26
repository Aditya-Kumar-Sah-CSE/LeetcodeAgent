import React, { useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Check,
} from "lucide-react";
import { detectPlatform, getCanonicalLeetCodeUrl } from "../services/leetcodeNavigation";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemSlug: string;
  problemTitle: string;
  problemUrl?: string;
  language: string;
  code: string;
  copySuccess: boolean;
  copyError?: string;
}

export default function SubmissionModal({
  isOpen,
  onClose,
  problemSlug,
  problemTitle,
  problemUrl,
  language,
  code,
  copySuccess,
  copyError,
}: SubmissionModalProps) {
  if (!isOpen) return null;

  const [copiedManual, setCopiedManual] = useState(false);
  const platform = detectPlatform();
  const canonicalUrl = problemUrl || getCanonicalLeetCodeUrl(problemSlug);

  const handleManualSelect = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.currentTarget.select();
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedManual(true);
      setTimeout(() => setCopiedManual(false), 2500);
    } catch {
      // User can select from textarea
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
        style={{
          background: "var(--color-bg-card)",
          borderColor: copySuccess ? "var(--color-accent)" : "rgba(248, 113, 113, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: copySuccess ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 191, 36, 0.15)",
              }}
            >
              {copySuccess ? (
                <CheckCircle2 size={22} style={{ color: "var(--color-success)" }} />
              ) : (
                <AlertTriangle size={22} style={{ color: "var(--color-warning)" }} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {copySuccess ? "Solution Copied to Clipboard!" : "Copy & Submit on LeetCode"}
              </h3>
              <p className="text-xs text-muted">
                {problemTitle} ({language.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Fallback if automatic clipboard failed */}
        {!copySuccess && (
          <div className="p-3.5 rounded-xl border space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "rgba(251, 191, 36, 0.3)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning">
                {copyError || "Clipboard write blocked. Select code below to copy:"}
              </span>
              <button
                onClick={handleManualCopy}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-accent text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedManual ? <Check size={12} /> : <Copy size={12} />}
                {copiedManual ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <textarea
              readOnly
              value={code}
              onClick={handleManualSelect}
              rows={4}
              className="w-full p-2 text-xs font-mono rounded bg-black/40 border border-gray-700 text-gray-200 outline-none resize-none"
            />
          </div>
        )}

        {/* Direct Action Button: Open LeetCode Problem */}
        <div className="space-y-2">
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] touch-target"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), #a78bfa)",
              color: "#fff",
              boxShadow: "0 4px 20px var(--color-accent-glow)",
            }}
          >
            <ExternalLink size={18} />
            Open Problem in LeetCode {platform !== "desktop" ? "(App / Web)" : ""}
          </a>

          {platform !== "desktop" && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Smartphone size={12} />
              <span>
                On {platform === "ios" ? "iPhone/iPad" : "Android"}, tapping will open the official LeetCode app if installed, or your browser.
              </span>
            </div>
          )}
        </div>

        {/* 6-Step Submission Guide */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <ShieldCheck size={14} style={{ color: "var(--color-success)" }} />
            <span>6-Step Submission Checklist:</span>
          </div>

          <ol className="space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">1.</span>
              <span><strong>Open:</strong> Tap the button above to go directly to <em>{problemTitle}</em>.</span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">2.</span>
              <span><strong>Language:</strong> Ensure the language selector on LeetCode matches <strong>{language}</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">3.</span>
              <span><strong>Paste:</strong> Tap into the LeetCode code editor and paste your copied code.</span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">4.</span>
              <span><strong>Run Code:</strong> Click <em>"Run"</em> to test against LeetCode's official example cases.</span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">5.</span>
              <span><strong>Review:</strong> Verify that outputs match and edge cases pass.</span>
            </li>
            <li className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: "var(--color-bg-primary)" }}>
              <span className="font-bold text-accent shrink-0 w-4">6.</span>
              <span><strong>Submit:</strong> Click <em>"Submit"</em> on LeetCode when you are ready!</span>
            </li>
          </ol>
        </div>

        {/* Security & User Control Notice */}
        <div className="p-3 rounded-lg text-[11px] text-muted border" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
          🔒 <strong>Privacy & Security:</strong> You retain complete manual control over submissions. LeetCodeAgent never requires passwords, never accesses session cookies, and never automatically submits code.
        </div>

        {/* Dismiss Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white cursor-pointer touch-target"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
