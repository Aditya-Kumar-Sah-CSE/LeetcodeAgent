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
  ExternalLink,
  Trophy,
} from "lucide-react";
import DifficultyBadge, {
  StatusDot,
  LoadingCard,
  ErrorBox,
  ProblemStatusBadge,
} from "../components/UIComponents";
import { InstallPwaBanner } from "../components/InstallPwaPrompt";
import { fetchDailyChallenge, checkHealth, fetchProfile } from "../services/api";
import {
  getUsername,
  getModelId,
  getApiKey,
  getAllSolutionsLocal,
  getActivities,
  isProblemSolved,
} from "../services/storage";
import type { DailyProblem, StoredSolution, ActivityEntry, LeetCodeProfile } from "../types";

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
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null);

  const username = getUsername() || "Aditya_Kumar_Sah-28";
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

    // Fetch LeetCode profile
    fetchProfile(username).then(setProfile).catch(() => {});
  }, [username]);

  return (
    <div className="space-y-5 max-w-full overflow-x-hidden pb-safe">
      {/* PWA Install Banner */}
      <InstallPwaBanner />

      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Sparkles size={22} style={{ color: "var(--color-accent)" }} />
              LeetCode AI Workspace
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Autonomous problem solving, intelligent algorithmic reasoning, and seamless LeetCode submissions.
            </p>
          </div>
          <button
            onClick={() => navigate("/workspace")}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 touch-target shadow-lg"
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
        className="flex flex-wrap items-center gap-2 sm:gap-4 py-2 px-3 rounded-xl border text-xs"
        style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border-subtle)" }}
      >
        <StatusDot
          status={backendOk === true ? "connected" : backendOk === false ? "disconnected" : "loading"}
          label={backendOk === true ? "FastAPI Online" : "Local Client Mode"}
        />
        <span className="hidden sm:inline" style={{ color: "var(--color-border)" }}>|</span>
        <StatusDot
          status={apiKey ? "connected" : "disconnected"}
          label={apiKey ? "OpenRouter Set" : "Free Model Defaults"}
        />
        <span className="hidden sm:inline" style={{ color: "var(--color-border)" }}>|</span>
        <StatusDot
          status={username ? "connected" : "disconnected"}
          label={`LeetCode: @${username}`}
        />
      </motion.div>

      {/* Main Grid: Responsive 1 col on mobile, 3 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <div className="card card-hover space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} style={{ color: "var(--color-accent)" }} />
                  <span className="text-xs font-medium text-muted">
                    Today's Challenge · {daily.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ProblemStatusBadge isSolved={isProblemSolved(daily.slug)} size="sm" />
                  <DifficultyBadge difficulty={daily.difficulty} />
                </div>
              </div>

              <h2
                className="text-lg sm:text-xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {daily.id}. {daily.title}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {daily.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-md"
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
                className="text-xs sm:text-sm line-clamp-3 text-secondary"
                dangerouslySetInnerHTML={{
                  __html: daily.description.replace(/<[^>]*>/g, " ").slice(0, 200) + "...",
                }}
              />

              <div className="flex flex-col sm:flex-row gap-2.5 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <button
                  onClick={() => navigate("/workspace", { state: { problem: daily } })}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95 touch-target"
                  style={{
                    background: "var(--color-accent)",
                    color: "#fff",
                  }}
                >
                  <Code2 size={16} />
                  Solve in Workspace
                </button>
                <button
                  onClick={() => navigate("/daily")}
                  className="py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border touch-target"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  View Details
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
          className="space-y-3"
        >
          {/* Connected LeetCode Profile Card */}
          <div
            className="card card-hover cursor-pointer"
            onClick={() => navigate("/settings")}
          >
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={username}
                  className="w-11 h-11 rounded-full border border-accent/40 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0">
                  {username[0]?.toUpperCase() || "A"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>@{username}</span>
                  <ExternalLink size={10} className="text-muted" />
                </div>
                <div className="text-[11px] text-muted">
                  Rank: #{profile?.ranking?.toLocaleString() || "1,284,577"}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold mt-0.5">
                  <span className="text-emerald-400">E:{profile?.solved_easy ?? 84}</span>
                  <span className="text-amber-400">M:{profile?.solved_medium ?? 48}</span>
                  <span className="text-red-400">H:{profile?.solved_hard ?? 6}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions Count */}
          <div className="card card-hover cursor-pointer" onClick={() => navigate("/solutions")}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(108, 99, 255, 0.12)" }}
              >
                <Code2 size={20} style={{ color: "var(--color-accent)" }} />
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {solutions.length}
                </div>
                <div className="text-xs text-muted">
                  Saved Solutions
                </div>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </div>
          </div>

          {/* Activity Count */}
          <div className="card card-hover cursor-pointer" onClick={() => navigate("/activity")}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(251, 191, 36, 0.12)" }}
              >
                <Flame size={20} style={{ color: "var(--color-warning)" }} />
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {activities.length}
                </div>
                <div className="text-xs text-muted">
                  Total Activities
                </div>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-semibold text-secondary">
            Recent Activities
          </h3>
          <button
            onClick={() => navigate("/activity")}
            className="text-xs font-medium cursor-pointer hover:underline text-accent"
          >
            View All
          </button>
        </div>
        {activities.length === 0 ? (
          <div className="card text-center py-6 text-muted text-xs">
            No activity recorded yet. Start solving problems with the AI workspace!
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="card flex items-center gap-3 py-2.5 px-3.5"
              >
                <span className="text-base shrink-0">
                  {act.type === "solve" ? "⚡" : act.type === "research" ? "📚" : act.type === "save" ? "💾" : "👁️"}
                </span>
                <span className="text-xs font-medium flex-1 truncate text-secondary">
                  {act.problem_title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded capitalize bg-elevated text-muted shrink-0">
                  {act.type}
                </span>
                <span className="text-[11px] text-muted shrink-0">
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
