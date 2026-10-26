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
