import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ExternalLink, Check, Copy, Download, RefreshCw, X, Laptop, ShieldAlert } from "lucide-react";

interface LocalDevModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BATCH_FILE_CONTENT = `@echo off
title LeetCode Agent - 1-Click Launcher
echo ========================================================
echo    Launching LeetCode Agent (Backend + Frontend)
echo ========================================================
echo.
echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "LeetCode Agent - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && if exist .venv\\Scripts\\activate.bat (call .venv\\Scripts\\activate.bat && uvicorn app.main:app --reload --port 8000) else (echo Virtualenv not found in backend\\.venv & pause)"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Vite Frontend on http://localhost:5173 ...
start "LeetCode Agent - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser on http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  Both servers are running in separate terminal windows!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173 (Opened in browser)
echo ========================================================
`;

export default function LocalDevModal({ isOpen, onClose }: LocalDevModalProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [frontendOnline, setFrontendOnline] = useState<boolean | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const bRes = await fetch("http://localhost:8000/", { method: "GET", mode: "cors" }).catch(() => null);
      setBackendOnline(!!bRes && bRes.ok);
    } catch {
      setBackendOnline(false);
    }

    try {
      const fRes = await fetch("http://localhost:5173/", { method: "HEAD", mode: "no-cors" }).catch(() => null);
      setFrontendOnline(!!fRes);
    } catch {
      setFrontendOnline(false);
    }
    setChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(".\\run-all.bat");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([BATCH_FILE_CONTENT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "run-all.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border"
          style={{
            background: "var(--color-bg-secondary)",
            borderColor: "var(--color-border-subtle)",
            color: "var(--color-text-primary)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
              >
                <Terminal size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Local Dev & Server Launcher</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Run FastAPI Backend & Vite Frontend on your PC
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status Checks */}
          <div className="my-5 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Local Environment Status
              </span>
              <button
                onClick={checkStatus}
                disabled={checking}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">Frontend (Vite)</div>
                  <div className="text-xs font-mono font-semibold">:5173</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    frontendOnline
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                  }`}
                >
                  {frontendOnline ? "🟢 Online" : "⚪ Offline"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">Backend (FastAPI)</div>
                  <div className="text-xs font-mono font-semibold">:8000</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    backendOnline
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                  }`}
                >
                  {backendOnline ? "🟢 Online" : "⚪ Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Launch Actions */}
          <div className="space-y-3">
            {/* If online: Big green button to open local app */}
            {(frontendOnline || backendOnline) && (
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer no-underline"
              >
                <Laptop size={16} />
                Open Local Workspace (http://localhost:5173)
                <ExternalLink size={14} />
              </a>
            )}

            {/* Launch Command snippet */}
            <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-xs text-blue-400 overflow-x-auto">
                <span className="text-[var(--color-text-muted)] select-none">$</span>
                <span>.\run-all.bat</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Download run-all.bat */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-xs font-medium transition-colors cursor-pointer"
              >
                <Download size={14} />
                Download run-all.bat
              </button>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-xs font-medium transition-colors cursor-pointer no-underline text-[var(--color-text-primary)]"
              >
                <ExternalLink size={14} />
                Open localhost:5173
              </a>
            </div>
          </div>

          {/* Browser Sandbox Security Notice */}
          <div className="mt-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2.5 items-start text-xs text-amber-300/90 leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold text-amber-300">Browser Security Notice: </span>
              Due to web security sandboxing, internet-deployed sites (Vercel / GitHub Pages) cannot directly execute local <code className="bg-amber-400/10 px-1 rounded font-mono">.bat</code> files on your Windows machine silently.
              Running <code className="bg-amber-400/10 px-1 rounded font-mono">.\run-all.bat</code> once locally starts both servers and automatically opens <code className="bg-amber-400/10 px-1 rounded font-mono">localhost:5173</code> in your browser!
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
