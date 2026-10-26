import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Code2,
  ExternalLink,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import DifficultyBadge, { LoadingCard, ErrorBox } from "../components/UIComponents";
import { fetchDailyChallenge, refreshDailyChallenge } from "../services/api";
import { addActivity } from "../services/storage";
import type { DailyProblem } from "../types";

export default function DailyPage() {
  const navigate = useNavigate();
  const [daily, setDaily] = useState<DailyProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDaily = (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const fetcher = forceRefresh ? refreshDailyChallenge : fetchDailyChallenge;
    fetcher()
      .then((data) => {
        setDaily(data);
        addActivity({
          type: "view",
          problem_slug: data.slug,
          problem_title: data.title,
          timestamp: new Date().toISOString(),
          details: `Viewed Daily Challenge (${data.difficulty})`,
        });
      })
      .catch((e) => setError(e.message || "Failed to load daily problem"))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDaily();
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full max-w-full overflow-x-hidden pb-safe">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Calendar size={22} style={{ color: "var(--color-accent)" }} />
            Daily LeetCode Challenge
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-muted">
            Official daily algorithmic problem directly from LeetCode.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => loadDaily(true)}
            disabled={refreshing || loading}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border touch-target disabled:opacity-50"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Force Refresh"}
          </button>

          {daily && (
            <button
              onClick={() => navigate("/workspace", { state: { problem: daily } })}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 touch-target shadow-lg"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                boxShadow: "0 0 16px var(--color-accent-glow)",
              }}
            >
              <Code2 size={16} />
              Solve in Workspace
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingCard lines={8} />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => loadDaily()} />
      ) : daily ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Problem Banner Card */}
          <div className="card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-elevated text-secondary shrink-0">
                  #{daily.id}
                </span>
                <h2
                  className="text-base sm:text-xl font-bold truncate text-white"
                  title={daily.title}
                >
                  {daily.title}
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                <DifficultyBadge difficulty={daily.difficulty} />
                <a
                  href={daily.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all border text-accent touch-target"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <ExternalLink size={12} />
                  Open on LeetCode
                </a>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
              <Tag size={13} className="text-muted shrink-0" />
              {daily.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary border border-border-subtle"
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs text-muted ml-auto hidden sm:inline">
                Scheduled: {daily.date}
              </span>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="card space-y-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
              <HelpCircle size={17} style={{ color: "var(--color-accent)" }} />
              Problem Description
            </h3>
            <div
              className="problem-description text-xs sm:text-sm overflow-x-auto break-words"
              dangerouslySetInnerHTML={{ __html: daily.description }}
            />
          </div>

          {/* Examples */}
          {daily.examples && daily.examples.length > 0 && (
            <div className="card space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
                <CheckCircle2 size={17} style={{ color: "var(--color-success)" }} />
                Example Test Cases
              </h3>
              <div className="space-y-3">
                {daily.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl space-y-2 font-mono text-xs overflow-x-auto break-words"
                    style={{
                      background: "var(--color-bg-primary)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <div className="font-sans font-semibold text-xs text-accent">
                      Example {idx + 1}:
                    </div>
                    <div>
                      <span className="text-muted">Input: </span>
                      <span className="text-white">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-muted">Output: </span>
                      <span style={{ color: "var(--color-success)" }}>{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="font-sans text-xs pt-1 text-secondary">
                        <span className="font-semibold text-muted">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {daily.constraints && daily.constraints.length > 0 && (
            <div className="card space-y-2.5">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
                <AlertCircle size={17} style={{ color: "var(--color-warning)" }} />
                Constraints & Invariants
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm font-mono text-secondary break-words">
                {daily.constraints.map((c, i) => (
                  <li key={i} className="text-xs">
                    <span dangerouslySetInnerHTML={{ __html: c }} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
