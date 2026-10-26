import React, { useState, useEffect } from "react";
import {
  Activity,
  Trash2,
  Calendar,
  CheckCircle,
  FileCode,
  Search,
  Eye,
  Zap,
} from "lucide-react";
import { getActivities } from "../services/storage";
import type { ActivityEntry } from "../types";
import { LoadingCard } from "../components/UIComponents";

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivities(100);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "solve":
        return <Zap size={16} className="text-yellow-400" />;
      case "research":
        return <Search size={16} className="text-cyan-400" />;
      case "save":
        return <FileCode size={16} className="text-emerald-400" />;
      case "view":
      default:
        return <Eye size={16} className="text-indigo-400" />;
    }
  };

  const filtered = activities.filter((act) => {
    if (filter === "all") return true;
    return act.type === filter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Activity size={24} style={{ color: "var(--color-accent)" }} />
            Activity Log
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Chronological audit log of all your AI generations, problem views, and saves.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border text-xs" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border-subtle)" }}>
          {["all", "solve", "save", "view", "research"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-2.5 py-1 rounded capitalize font-medium transition-all cursor-pointer"
              style={{
                background: filter === t ? "var(--color-accent)" : "transparent",
                color: filter === t ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <LoadingCard lines={6} />
      ) : filtered.length === 0 ? (
        <div
          className="card text-center py-16 flex flex-col items-center justify-center space-y-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Activity size={44} className="opacity-40" />
          <h3 className="text-base font-semibold text-white">No activity logged yet</h3>
          <p className="text-xs max-w-sm">
            As you view problems and run AI agent stages, your activity history will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="card flex items-center gap-3.5 py-3 px-4 hover:border-gray-600 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--color-bg-elevated)" }}
              >
                {getIcon(act.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {act.problem_title}
                  </span>
                  <span
                    className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded"
                    style={{
                      background: "var(--color-bg-secondary)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {act.type}
                  </span>
                </div>
                {act.details && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {act.details}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                <Calendar size={12} />
                <span>{new Date(act.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
