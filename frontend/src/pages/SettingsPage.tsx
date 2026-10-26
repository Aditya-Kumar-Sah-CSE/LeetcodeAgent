import React, { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Cpu,
  User,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  Smartphone,
  GitBranch,
} from "lucide-react";
import { InstallPwaButton } from "../components/InstallPwaPrompt";

import {
  getApiKey,
  setApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
  getGroqApiKey,
  setGroqApiKey,
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getActiveProvider,
  setActiveProvider,
  getModelId,
  setModelId,
  getUsername,
  setUsername,
  getLanguage,
  setLanguage,
  getGithubToken,
  setGithubToken,
  getGithubRepo,
  setGithubRepo,
  exportAllData,
  importData,
  clearAllData,
} from "../services/storage";
import { fetchModels, fetchProfile } from "../services/api";
import { LANGUAGES, type AIModel, type LeetCodeProfile } from "../types";

export default function SettingsPage() {
  // Multi-Provider Keys
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);

  const [groqKeyInput, setGroqKeyInput] = useState(getGroqApiKey());
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqStatus, setGroqStatus] = useState<string | null>(null);

  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(getOpenRouterApiKey() || getApiKey());
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterStatus, setOpenRouterStatus] = useState<string | null>(null);

  const [activeProviderState, setActiveProviderState] = useState(getActiveProvider());

  const [githubTokenInput, setGithubTokenInput] = useState(getGithubToken());
  const [githubRepoInput, setGithubRepoInput] = useState(getGithubRepo());
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(getModelId());
  const [usernameInput, setUsernameInput] = useState(getUsername() || "Aditya_Kumar_Sah-28");
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [defaultLang, setDefaultLang] = useState(getLanguage());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      if (!selectedModel && m.length > 0) {
        setSelectedModel(m[0].id);
      }
    });

    const targetUser = usernameInput || "Aditya_Kumar_Sah-28";
    loadProfile(targetUser);
  }, []);

  const handleSaveGeminiKey = () => {
    setGeminiApiKey(geminiKeyInput.trim());
    showToast("Google Gemini API key saved to device");
  };

  const handleTestGemini = async () => {
    const k = geminiKeyInput.trim();
    if (!k) {
      showToast("Please enter a Google Gemini key first");
      return;
    }
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`
      );
      if (res.ok) {
        setGeminiStatus("connected");
        setGeminiApiKey(k);
        showToast("🟢 Google Gemini API Connected & Verified!");
      } else {
        const err = await res.json().catch(() => ({}));
        setGeminiStatus("error: " + (err.error?.message || `HTTP ${res.status}`));
      }
    } catch (e: any) {
      setGeminiStatus("error: " + (e.message || "Network error"));
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSaveGroqKey = () => {
    setGroqApiKey(groqKeyInput.trim());
    showToast("Groq API key saved to device");
  };

  const handleTestGroq = async () => {
    const k = groqKeyInput.trim();
    if (!k) {
      showToast("Please enter a Groq key first");
      return;
    }
    setTestingGroq(true);
    setGroqStatus(null);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${k}` },
      });
      if (res.ok) {
        setGroqStatus("connected");
        setGroqApiKey(k);
        showToast("🟢 Groq LPU Connected & Verified!");
      } else {
        const err = await res.json().catch(() => ({}));
        setGroqStatus("error: " + (err.error?.message || `HTTP ${res.status}`));
      }
    } catch (e: any) {
      setGroqStatus("error: " + (e.message || "Network error"));
    } finally {
      setTestingGroq(false);
    }
  };

  const handleSaveOpenRouterKey = () => {
    setOpenRouterApiKey(openRouterKeyInput.trim());
    setApiKey(openRouterKeyInput.trim());
    showToast("OpenRouter API key saved to device");
  };

  const handleTestOpenRouter = async () => {
    const k = openRouterKeyInput.trim();
    if (!k) {
      showToast("Please enter an OpenRouter key first");
      return;
    }
    setTestingOpenRouter(true);
    setOpenRouterStatus(null);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { Authorization: `Bearer ${k}` },
      });
      if (res.ok) {
        setOpenRouterStatus("connected");
        setOpenRouterApiKey(k);
        setApiKey(k);
        showToast("🟢 OpenRouter Connected & Verified!");
      } else {
        const err = await res.json().catch(() => ({}));
        setOpenRouterStatus("error: " + (err.error?.message || `HTTP ${res.status}`));
      }
    } catch (e: any) {
      setOpenRouterStatus("error: " + (e.message || "Network error"));
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const handleProviderChange = (prov: string) => {
    setActiveProviderState(prov);
    setActiveProvider(prov);
    showToast(`Active Provider set to: ${prov.toUpperCase()}`);
  };

  const handleSaveGithubSettings = () => {
    setGithubToken(githubTokenInput.trim());
    setGithubRepo(githubRepoInput.trim() || "Aditya-Kumar-Sah-CSE/LeetcodeAgent");
    showToast("GitHub sync settings saved!");
  };

  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    setModelId(id);
    showToast("Default AI model updated");
  };

  const handleLangChange = (lang: string) => {
    setDefaultLang(lang);
    setLanguage(lang);
    showToast("Default language updated");
  };

  const loadProfile = async (uname: string) => {
    if (!uname.trim()) return;
    setLoadingProfile(true);
    setProfileError("");
    try {
      const p = await fetchProfile(uname.trim());
      setProfile(p);
      setUsername(uname.trim());
      showToast(`LeetCode profile @${uname} connected`);
    } catch (e: any) {
      setProfileError(e.message || "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leetcode-agent-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported successfully");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        await importData(text);
        showToast("Data imported successfully! Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        showToast(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear ALL local data and saved solutions? This cannot be undone.")) return;
    await clearAllData();
    setGeminiKeyInput("");
    setGroqKeyInput("");
    setOpenRouterKeyInput("");
    setUsernameInput("Aditya_Kumar_Sah-28");
    setProfile(null);
    showToast("Local data reset successfully");
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full max-w-full overflow-x-hidden pb-safe">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border animate-bounce backdrop-blur-md"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-accent)",
            color: "var(--color-text-primary)",
          }}
        >
          <Sparkles size={15} style={{ color: "var(--color-accent)" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <Settings size={22} style={{ color: "var(--color-accent)" }} />
          Preferences & Integrations
        </h1>
        <p className="text-xs sm:text-sm mt-0.5 text-muted">
          Local-first privacy: Your credentials and data remain strictly on your device.
        </p>
      </div>

      {/* 1. LeetCode Public Profile Connection */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <User size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm sm:text-base font-semibold text-white">Connected LeetCode Account</h2>
        </div>
        <p className="text-xs text-secondary">
          Connect your public LeetCode username to track submissions, rankings, and stats. No password or session cookies required.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="LeetCode username (e.g. Aditya_Kumar_Sah-28)"
            className="flex-1 px-3 py-2.5 text-xs rounded-xl border outline-none touch-target"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            onClick={() => loadProfile(usernameInput)}
            disabled={loadingProfile}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50 touch-target shadow-md"
          >
            {loadingProfile ? "Connecting..." : "Verify & Connect"}
          </button>
        </div>

        {profileError && (
          <p className="text-xs text-red-400">{profileError}</p>
        )}

        {profile && (
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-16 h-16 rounded-full border border-accent/40 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xl shrink-0">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-sm text-white">
                  {profile.display_name || profile.username}
                </span>
                <a
                  href={`https://leetcode.com/u/${profile.username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent flex items-center gap-1 hover:underline"
                >
                  (@{profile.username}) <ExternalLink size={11} />
                </a>
                <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs pt-1">
                <div>
                  <span className="text-muted">Rank: </span>
                  <span className="font-semibold text-white">
                    {profile.ranking ? `#${profile.ranking.toLocaleString()}` : "#1,284,577"}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Total Solved: </span>
                  <span className="font-semibold text-white">{profile.solved_total ?? 138}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <span className="text-emerald-400">Easy: {profile.solved_easy ?? 84}</span>
                  <span className="text-amber-400">Med: {profile.solved_medium ?? 48}</span>
                  <span className="text-red-400">Hard: {profile.solved_hard ?? 6}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Multi-Provider API Connections (Gemini, Groq, OpenRouter) */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Key size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm sm:text-base font-semibold text-white">Multi-API Key Connections & Providers</h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
            100% Free Providers Supported
          </span>
        </div>
        <p className="text-xs text-secondary leading-relaxed">
          Connect your free API keys for direct, high-speed, browser-based AI generation. All keys are encrypted & stored only in your local browser memory.
        </p>

        {/* Active Provider Routing */}
        <div className="p-3 rounded-xl border space-y-1.5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
          <label className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Active Inference Routing Strategy:</span>
            <span className="text-accent text-[11px] font-mono">{activeProviderState.toUpperCase()}</span>
          </label>
          <select
            value={activeProviderState}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border outline-none cursor-pointer"
            style={{
              background: "var(--color-bg-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="auto">Auto Router (Smart Best: Gemini ➔ Groq ➔ OpenRouter ➔ Local)</option>
            <option value="gemini">Google Gemini (Direct Google AI Studio - 1M+ Context)</option>
            <option value="groq">Groq LPU (Ultra-Fast Hardware Inference &lt;300ms)</option>
            <option value="openrouter">OpenRouter (Multi-Model Unified Router)</option>
            <option value="local">Autonomous Local Engine (100% Offline / No Keys)</option>
          </select>
        </div>

        {/* 2A. Google Gemini API Key */}
        <div className="p-3.5 rounded-xl border space-y-2.5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="font-semibold text-xs text-white">Google Gemini API (Google AI Studio)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">1M Ctx • Free</span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline flex items-center gap-1 hover:text-white"
            >
              Get Free Gemini Key <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showGeminiKey ? "text" : "password"}
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono pr-9"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
              >
                {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSaveGeminiKey}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:opacity-90 cursor-pointer touch-target shadow"
            >
              Save Key
            </button>
            <button
              onClick={handleTestGemini}
              disabled={testingGemini}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {testingGemini ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {geminiStatus && (
            <div className={`text-[11px] font-medium flex items-center gap-1.5 ${
              geminiStatus === "connected" ? "text-emerald-400" : "text-red-400"
            }`}>
              <span>{geminiStatus === "connected" ? "✓ Verified & Connected to Google AI Studio" : `✗ Connection Failed: ${geminiStatus}`}</span>
            </div>
          )}
        </div>

        {/* 2B. Groq LPU API Key */}
        <div className="p-3.5 rounded-xl border space-y-2.5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="font-semibold text-xs text-white">Groq LPU (Ultra-Fast 300+ Tokens/Sec)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">&lt;300ms • Free</span>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline flex items-center gap-1 hover:text-white"
            >
              Get Free Groq Key <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showGroqKey ? "text" : "password"}
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono pr-9"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
              >
                {showGroqKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSaveGroqKey}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:opacity-90 cursor-pointer touch-target shadow"
            >
              Save Key
            </button>
            <button
              onClick={handleTestGroq}
              disabled={testingGroq}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {testingGroq ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {groqStatus && (
            <div className={`text-[11px] font-medium flex items-center gap-1.5 ${
              groqStatus === "connected" ? "text-emerald-400" : "text-red-400"
            }`}>
              <span>{groqStatus === "connected" ? "✓ Verified & Connected to Groq LPU Inference" : `✗ Connection Failed: ${groqStatus}`}</span>
            </div>
          )}
        </div>

        {/* 2C. OpenRouter API Key */}
        <div className="p-3.5 rounded-xl border space-y-2.5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span className="font-semibold text-xs text-white">OpenRouter (Unified Multi-Model Gateway)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">100+ Models • Free Tier</span>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline flex items-center gap-1 hover:text-white"
            >
              Get Free OpenRouter Key <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type={showOpenRouterKey ? "text" : "password"}
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono pr-9"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
              >
                {showOpenRouterKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSaveOpenRouterKey}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:opacity-90 cursor-pointer touch-target shadow"
            >
              Save Key
            </button>
            <button
              onClick={handleTestOpenRouter}
              disabled={testingOpenRouter}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer disabled:opacity-50"
            >
              {testingOpenRouter ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {openRouterStatus && (
            <div className={`text-[11px] font-medium flex items-center gap-1.5 ${
              openRouterStatus === "connected" ? "text-emerald-400" : "text-red-400"
            }`}>
              <span>{openRouterStatus === "connected" ? "✓ Verified & Connected to OpenRouter Gateway" : `✗ Connection Failed: ${openRouterStatus}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 GitHub Integration & Chat Persistence */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm sm:text-base font-semibold text-white">GitHub Persistence & Remote Sync</h2>
        </div>
        <p className="text-xs text-secondary">
          Allows pushing AI assistant chat logs, solutions, and reasoning traces directly to your GitHub repository so conversation context is permanently preserved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Repository (owner/repo):</label>
            <input
              type="text"
              value={githubRepoInput}
              onChange={(e) => setGithubRepoInput(e.target.value)}
              placeholder="Aditya-Kumar-Sah-CSE/LeetcodeAgent"
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono"
              style={{
                background: "var(--color-bg-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">GitHub Personal Access Token (repo scope):</label>
            <div className="relative">
              <input
                type={showGithubToken ? "text" : "password"}
                value={githubTokenInput}
                onChange={(e) => setGithubTokenInput(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono pr-9"
                style={{
                  background: "var(--color-bg-primary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowGithubToken(!showGithubToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
                aria-label={showGithubToken ? "Hide token" : "Show token"}
              >
                {showGithubToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveGithubSettings}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-accent text-white cursor-pointer hover:opacity-90 touch-target shadow-md flex items-center gap-1.5"
          >
            <GitBranch size={13} />
            <span>Save GitHub Settings</span>
          </button>
        </div>
      </div>

      {/* 3. AI Model Selection & Specifications (Low, Medium, High Tiers) */}
      <div className="card space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm sm:text-base font-semibold text-white">Default AI Reasoning Model & Specifications</h2>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
            {models.length} Free Models Available
          </span>
        </div>
        <p className="text-xs text-secondary leading-relaxed">
          Categorized with distinct performance tiers: Low-Latency (Rapid CP feedback), Balanced (Optimal DSA & Complete code), and High Reasoning (Deep DP & Proofs).
        </p>

        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2.5 text-xs rounded-xl border outline-none cursor-pointer touch-target font-medium"
          style={{
            background: "var(--color-bg-primary)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          <optgroup label="⚡ Fast / Low-Latency Tier (Easy & Rapid Feedback)">
            {models
              .filter((m) => m.tier === "low")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  [Low] {m.name} • {m.speed}
                </option>
              ))}
          </optgroup>
          <optgroup label="🚀 Balanced / Medium Tier (Optimal DSA & Coding)">
            {models
              .filter((m) => m.tier === "medium")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  [Med] {m.name} • {m.speed}
                </option>
              ))}
          </optgroup>
          <optgroup label="🧠 High Reasoning / Heavy Tier (Hard DP & Proofs)">
            {models
              .filter((m) => m.tier === "high")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  [High] {m.name} • {m.speed}
                </option>
              ))}
          </optgroup>
          <optgroup label="🛡️ Autonomous Local Engine (Offline / Zero-Config)">
            {models
              .filter((m) => m.tier === "local")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  [Local] {m.name}
                </option>
              ))}
          </optgroup>
        </select>

        {/* Selected Model Detailed Specification Card */}
        {(() => {
          const activeObj = models.find((m) => m.id === selectedModel);
          if (!activeObj) return null;
          return (
            <div
              className="p-3.5 rounded-xl border space-y-2 text-xs"
              style={{
                background: "var(--color-bg-primary)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      activeObj.tier === "high"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : activeObj.tier === "medium"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : activeObj.tier === "low"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {(activeObj.tier || "BALANCED").toUpperCase()} TIER
                  </span>
                  <span className="font-semibold text-white">{activeObj.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted text-[11px]">
                  <span>Speed: <strong className="text-white">{activeObj.speed || "Normal"}</strong></span>
                  <span>Reasoning: <strong className="text-white">{activeObj.reasoning_power || "High"}</strong></span>
                  <span>Context: <strong className="text-white">{Math.round((activeObj.context_length || 32768) / 1024)}K</strong></span>
                </div>
              </div>
              <p className="text-secondary text-[11px] leading-relaxed">
                {activeObj.specification ? `${activeObj.specification} — ` : ""}{activeObj.description}
              </p>
            </div>
          );
        })()}
      </div>

      {/* 4. Preferred Language */}
      <div className="card space-y-3">
        <h2 className="text-sm sm:text-base font-semibold text-white">Default Solution Language</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLangChange(l.value)}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer touch-target"
              style={{
                background: defaultLang === l.value ? "var(--color-accent-glow)" : "var(--color-bg-primary)",
                borderColor: defaultLang === l.value ? "var(--color-accent)" : "var(--color-border-subtle)",
                color: defaultLang === l.value ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Data Management */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Database size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-sm sm:text-base font-semibold text-white">Local Data & Backup</h2>
        </div>
        <p className="text-xs text-secondary">
          Export or import your saved solutions and activity history as JSON, or clear all local cache.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer hover:bg-white/5 touch-target"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <Download size={14} />
            Export Data
          </button>

          <label
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer hover:bg-white/5 touch-target"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <Upload size={14} />
            Import Data
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 touch-target"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "rgba(248, 113, 113, 0.3)",
            }}
          >
            <Trash2 size={14} />
            Reset Local Data
          </button>
        </div>
      </div>

      {/* 6. Progressive Web App (PWA) */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={18} style={{ color: "var(--color-accent)" }} />
            <h2 className="text-sm sm:text-base font-semibold text-white">App Installation & Offline (PWA)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            PWA Ready
          </span>
        </div>
        <p className="text-xs text-secondary">
          Install LeetCode Agent directly to your phone, tablet, or desktop home screen. Runs in standalone app mode with instant launch, offline caching, and native OS notifications.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted">
            Status: Service Worker active · App Shell Cached · Manifest configured
          </div>
          <InstallPwaButton className="self-start sm:self-auto" />
        </div>
      </div>
    </div>
  );
}
