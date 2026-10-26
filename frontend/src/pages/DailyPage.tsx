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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Calendar size={24} style={{ color: "var(--color-accent)" }} />
            Daily LeetCode Challenge
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Discover and conquer today's featured algorithmic problem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDaily(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:bg-opacity-80 disabled:opacity-50"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Force Refresh"}
          </button>

          {daily && (
            <button
              onClick={() => navigate("/workspace", { state: { problem: daily } })}
              className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                boxShadow: "0 0 16px var(--color-accent-glow)",
              }}
            >
              <Code2 size={16} />
              Open in AI Workspace
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
          className="space-y-6"
        >
          {/* Problem Banner Card */}
          <div className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                  #{daily.id}
                </span>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {daily.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <DifficultyBadge difficulty={daily.difficulty} />
                <a
                  href={daily.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all hover:underline"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <ExternalLink size={12} />
                  Open on LeetCode
                </a>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <Tag size={14} style={{ color: "var(--color-text-muted)" }} />
              {daily.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-md"
                  style={{
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
                Scheduled for: {daily.date}
              </span>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="card space-y-3">
            <h3
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <HelpCircle size={18} style={{ color: "var(--color-accent)" }} />
              Problem Description
            </h3>
            <div
              className="problem-description"
              dangerouslySetInnerHTML={{ __html: daily.description }}
            />
          </div>

          {/* Examples */}
          {daily.examples && daily.examples.length > 0 && (
            <div className="card space-y-4">
              <h3
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />
                Example Test Cases
              </h3>
              <div className="space-y-3">
                {daily.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg space-y-2 font-mono text-xs"
                    style={{
                      background: "var(--color-bg-primary)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <div className="font-sans font-semibold text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                      Example {idx + 1}:
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>Input: </span>
                      <span style={{ color: "var(--color-text-primary)" }}>{ex.input}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>Output: </span>
                      <span style={{ color: "var(--color-success)" }}>{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="font-sans text-xs pt-1" style={{ color: "var(--color-text-secondary)" }}>
                        <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>Explanation: </span>
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
            <div className="card space-y-3">
              <h3
                className="text-base font-semibold flex items-center gap-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                <AlertCircle size={18} style={{ color: "var(--color-warning)" }} />
                Constraints & Invariants
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
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
