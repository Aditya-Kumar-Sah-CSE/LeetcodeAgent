/**
 * PWA Service: Handles beforeinstallprompt, install triggers, standalone detection, and iOS support.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function canInstallPwa(): boolean {
  if (isPwaInstalled()) return false;
  // If Chrome/Edge/Android fired beforeinstallprompt OR if iOS Safari where manual install is available
  return Boolean(deferredPrompt) || isIos();
}

export function hasNativePrompt(): boolean {
  return Boolean(deferredPrompt);
}

export function subscribePwaState(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("PWA subscriber error:", e);
    }
  });
}

// Global window event listener initialized once
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "ios" | "unavailable"> {
  if (isPwaInstalled()) {
    return "accepted";
  }

  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        deferredPrompt = null;
      }
      notifyListeners();
      return choice.outcome;
    } catch (err) {
      console.warn("PWA install error:", err);
      return "dismissed";
    }
  }

  if (isIos()) {
    return "ios";
  }

  return "unavailable";
}
