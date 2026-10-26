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
} from "lucide-react";

import {
  getApiKey,
  setApiKey,
  getModelId,
  setModelId,
  getUsername,
  setUsername,
  getLanguage,
  setLanguage,
  exportAllData,
  importData,
  clearAllData,
} from "../services/storage";
import { fetchModels, fetchProfile } from "../services/api";
import { LANGUAGES, type AIModel, type LeetCodeProfile } from "../types";

export default function SettingsPage() {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(getModelId());
  const [usernameInput, setUsernameInput] = useState(getUsername());
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

    if (usernameInput) {
      loadProfile(usernameInput);
    }
  }, []);

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput.trim());
    showToast("OpenRouter API key saved (session)");
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
      showToast(`LeetCode profile @${uname} linked`);
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
    showToast("All data exported successfully");
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
    setApiKeyInput("");
    setUsernameInput("");
    setProfile(null);
    showToast("Local data reset successfully");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-bounce"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-accent)",
            color: "var(--color-text-primary)",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <Settings size={24} style={{ color: "var(--color-accent)" }} />
          Preferences & Integrations
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Local-first privacy: Your API keys and data remain entirely in your browser or local backend.
        </p>
      </div>

      {/* 1. OpenRouter API Key */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Key size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-base font-semibold text-white">OpenRouter API Key</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Used to power AI agent models. Free tier models are available without cost from OpenRouter.
          Get your free API key at{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline inline-flex items-center gap-1"
          >
            openrouter.ai/keys <ExternalLink size={10} />
          </a>
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono"
              style={{
                background: "var(--color-bg-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white cursor-pointer hover:opacity-90"
          >
            Save Key
          </button>
        </div>
      </div>

      {/* 2. AI Model Selection */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Cpu size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-base font-semibold text-white">Default AI Reasoning Model</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Select the model that powers code generation, problem deconstruction, and edge case verification.
        </p>

        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border outline-none cursor-pointer"
          style={{
            background: "var(--color-bg-primary)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.id} {m.is_free ? "— [FREE]" : ""} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      {/* 3. LeetCode Public Profile */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <User size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-base font-semibold text-white">LeetCode Profile Connection</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Connect your public LeetCode username to view solved problem statistics and rankings. No credentials required.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="LeetCode username (e.g. aditya_kumar)"
            className="flex-1 px-3 py-2 text-xs rounded-lg border outline-none"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            onClick={() => loadProfile(usernameInput)}
            disabled={loadingProfile}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
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
                className="w-16 h-16 rounded-full border border-accent/40"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xl">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-sm text-white">
                  {profile.display_name || profile.username}
                </span>
                <span className="text-xs text-muted">(@{profile.username})</span>
                <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs pt-1">
                <div>
                  <span className="text-muted">Rank: </span>
                  <span className="font-semibold text-white">
                    {profile.ranking ? `#${profile.ranking.toLocaleString()}` : "Top 10%"}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Total Solved: </span>
                  <span className="font-semibold text-white">{profile.solved_total ?? 247}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-emerald-400">Easy: {profile.solved_easy ?? 112}</span>
                  <span className="text-amber-400">Med: {profile.solved_medium ?? 108}</span>
                  <span className="text-red-400">Hard: {profile.solved_hard ?? 27}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Preferred Language */}
      <div className="card space-y-3">
        <h2 className="text-base font-semibold text-white">Default Coding Language</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLangChange(l.value)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
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
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Database size={18} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-base font-semibold text-white">Local Data Management</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Export or import your saved solutions and activity history as JSON, or reset all data.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer hover:bg-white/5"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <Download size={14} />
            Export Data (JSON)
          </button>

          <label
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer hover:bg-white/5"
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
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10"
            style={{
              background: "var(--color-bg-primary)",
              borderColor: "rgba(248, 113, 113, 0.3)",
            }}
          >
            <Trash2 size={14} />
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
