/**
 * LeetCode Navigation & Clipboard Service.
 * Provides robust, platform-aware clipboard operations and verified LeetCode URLs.
 */

export type Platform = "ios" | "android" | "desktop";

export interface CopyResult {
  success: boolean;
  error?: string;
  fallbackText?: string;
}

/**
 * Conservatively detect client platform without fragile assumptions.
 */
export function detectPlatform(): Platform {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "desktop";
  }

  const ua = navigator.userAgent || "";
  const isTouch = navigator.maxTouchPoints > 0;

  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && isTouch)) {
    return "ios";
  }

  if (/Android/i.test(ua)) {
    return "android";
  }

  return "desktop";
}

/**
 * Returns canonical verified HTTPS URL for a LeetCode problem.
 */
export function getCanonicalLeetCodeUrl(slug: string): string {
  const cleanSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  return `https://leetcode.com/problems/${cleanSlug}/`;
}

/**
 * Copy text to clipboard using the modern Clipboard API,
 * falling back to document.execCommand, and finally returning fallback text.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: "Solution code is empty.",
    };
  }

  // 1. Try modern navigator.clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err: any) {
      console.warn("navigator.clipboard.writeText failed, trying fallback:", err);
    }
  }

  // 2. Legacy fallback using temporary textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid mobile screen zoom/scroll jumps
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0.01";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true };
    }
  } catch (err: any) {
    console.warn("document.execCommand fallback failed:", err);
  }

  // 3. Manual copy fallback
  return {
    success: false,
    error: "Automatic clipboard write was blocked by your browser.",
    fallbackText: text,
  };
}

/**
 * Safe navigation to LeetCode problem page.
 * Returns true if navigation was triggered directly, false if pop-up blocked or deferred.
 */
export function navigateToLeetCode(url: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened && !opened.closed) {
      return true;
    }
  } catch (e) {
    console.warn("window.open failed:", e);
  }

  // Fallback: direct window location change or manual button trigger
  return false;
}
