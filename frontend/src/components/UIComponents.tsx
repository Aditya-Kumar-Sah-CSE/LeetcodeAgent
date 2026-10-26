import React from "react";

interface DifficultyBadgeProps {
  difficulty: "Easy" | "Medium" | "Hard" | string;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const d = difficulty.toLowerCase();
  const cls =
    d === "easy"
      ? "badge-easy"
      : d === "medium"
      ? "badge-medium"
      : "badge-hard";

  return <span className={cls}>{difficulty}</span>;
}

interface StatusDotProps {
  status: "connected" | "disconnected" | "loading";
  label: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  const color =
    status === "connected"
      ? "var(--color-success)"
      : status === "loading"
      ? "var(--color-warning)"
      : "var(--color-danger)";

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        className="text-xs font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
    </div>
  );
}

interface LoadingCardProps {
  lines?: number;
}

export function LoadingCard({ lines = 3 }: LoadingCardProps) {
  return (
    <div className="card space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="loading-shimmer"
          style={{
            height: i === 0 ? "1.25rem" : "0.875rem",
            width: i === 0 ? "60%" : i === lines - 1 ? "40%" : "80%",
          }}
        />
      ))}
    </div>
  );
}

interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div
      className="card flex items-start gap-3"
      style={{ borderColor: "rgba(248, 113, 113, 0.3)" }}
    >
      <span className="text-lg">⚠️</span>
      <div className="flex-1">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-danger)" }}
        >
          Something went wrong
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Problem Solved / New Status Badges & Toggles ─────────

interface ProblemStatusBadgeProps {
  isSolved: boolean;
  size?: "sm" | "md";
  interactive?: boolean;
  onToggle?: () => void;
  showAccountHint?: boolean;
}

export function ProblemStatusBadge({
  isSolved,
  size = "sm",
  interactive = false,
  onToggle,
  showAccountHint = false,
}: ProblemStatusBadgeProps) {
  if (isSolved) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-full transition-all shrink-0 ${
          size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1"
        } ${interactive ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
        style={{
          background: "rgba(16, 185, 129, 0.15)",
          color: "#34d399",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.15)",
        }}
        title={
          interactive
            ? "Solved on connected account. Click to toggle status"
            : "Solved on connected LeetCode account"
        }
        onClick={interactive ? onToggle : undefined}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <span>{showAccountHint ? "✓ Solved on @Aditya_Kumar_Sah-28" : "✓ Solved"}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full transition-all shrink-0 ${
        size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1"
      } ${interactive ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
      style={{
        background: "rgba(168, 85, 247, 0.15)",
        color: "#c084fc",
        border: "1px solid rgba(168, 85, 247, 0.35)",
        boxShadow: "0 0 10px rgba(168, 85, 247, 0.15)",
      }}
      title={
        interactive
          ? "New problem. Click to mark as Solved"
          : "New problem / Unsolved"
      }
      onClick={interactive ? onToggle : undefined}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
      <span>★ New</span>
    </span>
  );
}

interface ProblemStatusToggleProps {
  isSolved: boolean;
  onToggle: () => void;
  className?: string;
  compact?: boolean;
}

export function ProblemStatusToggle({
  isSolved,
  onToggle,
  className = "",
  compact = false,
}: ProblemStatusToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border touch-target ${
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
      } ${className}`}
      style={{
        background: isSolved ? "rgba(16, 185, 129, 0.12)" : "rgba(168, 85, 247, 0.12)",
        borderColor: isSolved ? "rgba(16, 185, 129, 0.3)" : "rgba(168, 85, 247, 0.3)",
        color: isSolved ? "#34d399" : "#c084fc",
      }}
      title={isSolved ? "Click to mark as New" : "Click to mark as Solved"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSolved ? "bg-emerald-400" : "bg-purple-400"}`} />
      <span>{isSolved ? (compact ? "Mark New" : "Mark as New") : (compact ? "Mark Solved" : "Mark as Solved")}</span>
    </button>
  );
}
