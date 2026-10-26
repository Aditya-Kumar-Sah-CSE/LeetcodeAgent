import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Code2,
  Flame,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import DifficultyBadge, {
  StatusDot,
  LoadingCard,
  ErrorBox,
} from "../components/UIComponents";
import { fetchDailyChallenge, checkHealth } from "../services/api";
import { getUsername, getModelId, getApiKey } from "../services/storage";
import { getAllSolutionsLocal, getActivities } from "../services/storage";
import type { DailyProblem, StoredSolution, ActivityEntry } from "../types";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [daily, setDaily] = useState<DailyProblem | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState("");
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [solutions, setSolutions] = useState<StoredSolution[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  const username = getUsername();
  const modelId = getModelId();
  const apiKey = getApiKey();

  useEffect(() => {
    // Check backend
    checkHealth()
      .then((res) => setBackendOk(res.status === "ok"))
      .catch(() => setBackendOk(false));

    // Fetch daily
    fetchDailyChallenge()
      .then(setDaily)
      .catch((e) => setDailyError(e.message))
      .finally(() => setDailyLoading(false));

    // Load local data
    getAllSolutionsLocal().then(setSolutions);
    getActivities(5).then(setActivities);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Sparkles size={24} style={{ color: "var(--color-accent)" }} />
              LeetCode AI Workspace
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Autonomous problem solving, intelligent algorithmic reasoning, and seamless LeetCode submissions.
            </p>
          </div>
          <button
            onClick={() => navigate("/workspace")}
            className="px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              boxShadow: "0 0 16px var(--color-accent-glow)",
            }}
          >
            <Code2 size={16} />
            Open Workspace
          </button>
        </div>
      </motion.div>

      {/* Status Row */}
      <motion.div
        {...fadeIn}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-4 py-2 px-3 rounded-lg"
        style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border-subtle)" }}
      >
        <StatusDot
          status={backendOk === true ? "connected" : backendOk === false ? "disconnected" : "loading"}
          label={backendOk === true ? "Backend connected (FastAPI)" : "Client Mode (Local-First)"}
        />
        <span style={{ color: "var(--color-border)" }}>|</span>
        <StatusDot
          status={apiKey ? "connected" : "disconnected"}
          label={apiKey ? "OpenRouter Connected" : "No API Key (Using Defaults)"}
        />
        <span style={{ color: "var(--color-border)" }}>|</span>
        <StatusDot
          status={username ? "connected" : "disconnected"}
          label={username ? `LeetCode: @${username}` : "LeetCode: Not connected"}
        />
        <span style={{ color: "var(--color-border)" }}>|</span>
        <StatusDot
          status={modelId ? "connected" : "loading"}
          label={modelId ? modelId.split("/").pop() || "Custom Model" : "Gemini 2.0 Flash Lite (Free)"}
        />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Problem - Takes 2 cols */}
        <motion.div
          {...fadeIn}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          {dailyLoading ? (
            <LoadingCard lines={5} />
          ) : dailyError ? (
            <ErrorBox
              message={dailyError}
              onRetry={() => {
                setDailyLoading(true);
                setDailyError("");
                fetchDailyChallenge()
                  .then(setDaily)
                  .catch((e) => setDailyError(e.message))
                  .finally(() => setDailyLoading(false));
              }}
            />
          ) : daily ? (
            <div className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar
                    size={16}
                    style={{ color: "var(--color-accent)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Today's Challenge · {daily.date}
                  </span>
                </div>
                <DifficultyBadge difficulty={daily.difficulty} />
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                {daily.id}. {daily.title}
              </h2>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {daily.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 text-xs rounded-md"
                    style={{
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p
                className="text-sm line-clamp-3 mb-4"
                style={{ color: "var(--color-text-secondary)" }}
                dangerouslySetInnerHTML={{
                  __html: daily.description.replace(/<[^>]*>/g, " ").slice(0, 220) + "...",
                }}
              />
              <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <button
                  onClick={() => navigate("/workspace", { state: { problem: daily } })}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2 hover:opacity-90"
                  style={{
                    background: "var(--color-accent)",
                    color: "#fff",
                  }}
                >
                  <Code2 size={16} />
                  Solve with AI Agent
                </button>
                <button
                  onClick={() => navigate("/daily")}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  View Details & Testcases
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Stats Column */}
        <motion.div
          {...fadeIn}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          {/* Solutions Count */}
          <div className="card card-hover cursor-pointer" onClick={() => navigate("/solutions")}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(108, 99, 255, 0.12)" }}
              >
                <Code2 size={20} style={{ color: "var(--color-accent)" }} />
              </div>
              <div className="flex-1">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {solutions.length}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Saved Solutions
                </div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* Activity Count */}
          <div className="card card-hover cursor-pointer" onClick={() => navigate("/activity")}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(251, 191, 36, 0.12)" }}
              >
                <Flame size={20} style={{ color: "var(--color-warning)" }} />
              </div>
              <div className="flex-1">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {activities.length}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Total Activities
                </div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>

          {/* AI Model configured */}
          <div className="card card-hover cursor-pointer" onClick={() => navigate("/settings")}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(52, 211, 153, 0.12)" }}
              >
                <Cpu size={20} style={{ color: "var(--color-success)" }} />
              </div>
              <div className="flex-1 truncate">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {modelId ? modelId.split("/").pop() : "Gemini Flash Lite"}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Active Model Settings
                </div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Recent Agent Activities
          </h3>
          <button
            onClick={() => navigate("/activity")}
            className="text-xs font-medium cursor-pointer hover:underline"
            style={{ color: "var(--color-accent)" }}
          >
            View All
          </button>
        </div>
        {activities.length === 0 ? (
          <div
            className="card text-center py-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            <p className="text-sm">No activity recorded yet. Start solving problems with the AI workspace!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="card flex items-center gap-3 py-2.5 px-4"
              >
                <span className="text-base">
                  {act.type === "solve"
                    ? "⚡"
                    : act.type === "research"
                    ? "📚"
                    : act.type === "save"
                    ? "💾"
                    : "👁️"}
                </span>
                <span
                  className="text-sm font-medium flex-1 truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {act.problem_title}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded capitalize"
                  style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}
                >
                  {act.type}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {new Date(act.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
