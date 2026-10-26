import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, CheckCircle, X, Smartphone, Monitor } from "lucide-react";
import {
  isPwaInstalled,
  isIos,
  hasNativePrompt,
  promptPwaInstall,
  subscribePwaState,
} from "../services/pwa";

export function InstallPwaButton({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "compact" | "drawer";
  className?: string;
}) {
  const [installed, setInstalled] = useState(isPwaInstalled());
  const [canPrompt, setCanPrompt] = useState(hasNativePrompt() || isIos());
  const [showIosModal, setShowIosModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const unsub = subscribePwaState(() => {
      setInstalled(isPwaInstalled());
      setCanPrompt(hasNativePrompt() || isIos());
    });
    return unsub;
  }, []);

  if (installed) {
    if (variant === "compact") return null;
    return (
      <div
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 ${className}`}
      >
        <CheckCircle size={14} />
        <span>App Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    const result = await promptPwaInstall();
    setInstalling(false);
    if (result === "ios") {
      setShowIosModal(true);
    }
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleInstallClick}
          disabled={installing}
          title="Install as App (PWA)"
          aria-label="Install as App"
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 touch-target ${className}`}
          style={{
            background: "linear-gradient(135deg, var(--color-accent), #8b5cf6)",
            color: "#ffffff",
          }}
        >
          <Download size={13} />
          <span>Install</span>
        </button>

        {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
      </>
    );
  }

  if (variant === "drawer") {
    return (
      <>
        <button
          onClick={handleInstallClick}
          disabled={installing}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-sm ${className}`}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))",
            borderColor: "rgba(168, 85, 247, 0.4)",
            color: "#ffffff",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <Download size={14} color="#fff" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Install App</div>
              <div className="text-[10px] text-muted">Offline & 1-Tap Access</div>
            </div>
          </div>
          <span className="text-[10px] bg-accent/30 text-accent-light px-2 py-0.5 rounded-full font-bold">
            PWA
          </span>
        </button>

        {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${className}`}
        style={{
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-border-subtle)",
          color: "var(--color-text-primary)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-subtle)")}
      >
        <Download size={15} className="text-accent" />
        <span>Install App</span>
      </button>

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
}

export function InstallPwaBanner() {
  const [installed, setInstalled] = useState(isPwaInstalled());
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("pwa_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const unsub = subscribePwaState(() => {
      setInstalled(isPwaInstalled());
    });
    return unsub;
  }, []);

  if (installed || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pwa_banner_dismissed", "true");
    } catch {}
  };

  const handleInstall = async () => {
    const res = await promptPwaInstall();
    if (res === "ios") {
      setShowIosModal(true);
    }
  };

  return (
    <>
      <div
        className="w-full mb-4 p-3 sm:p-4 rounded-xl border relative overflow-hidden transition-all shadow-lg animate-in fade-in duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(22, 24, 34, 0.95), rgba(30, 27, 75, 0.4))",
          borderColor: "rgba(99, 102, 241, 0.35)",
        }}
      >
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, var(--color-accent), #8b5cf6)" }}
            >
              <Download size={20} color="#fff" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                Install LeetCode Agent as an App
                <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-accent/20 text-accent">
                  PWA Ready
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5 max-w-xl">
                Add to your phone or desktop home screen for full-screen immersive coding, instant offline loads, and fast 1-tap solution workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              style={{ background: "linear-gradient(135deg, var(--color-accent), #8b5cf6)" }}
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-muted hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss install banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
}

export function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 border shadow-2xl relative"
        style={{
          background: "var(--color-bg-secondary)",
          borderColor: "var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted hover:text-white rounded-lg cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
            <p className="text-xs text-muted">Add to Home Screen in 2 quick steps</p>
          </div>
        </div>

        <div className="space-y-3.5 py-2">
          <div
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
              1
            </div>
            <div className="text-xs text-white">
              Tap the <strong className="text-indigo-400 inline-flex items-center gap-1 mx-1"><Share size={12} /> Share</strong> button in Safari's bottom toolbar.
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
              2
            </div>
            <div className="text-xs text-white">
              Scroll down and tap <strong className="text-indigo-400 inline-flex items-center gap-1 mx-1"><PlusSquare size={12} /> Add to Home Screen</strong>.
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
              3
            </div>
            <div className="text-xs text-white">
              Tap <strong className="text-indigo-400">Add</strong> in the top right corner. The app icon will now appear on your home screen!
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
          style={{ background: "var(--color-accent)" }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
