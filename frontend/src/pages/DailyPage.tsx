import React, { useEffect, useState, useTransition } from "react";
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
  Search,
  BookOpen,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import DifficultyBadge, {
  LoadingCard,
  ErrorBox,
  ProblemStatusBadge,
  ProblemStatusToggle,
} from "../components/UIComponents";
import {
  fetchDailyChallenge,
  refreshDailyChallenge,
  fetchTopics,
  fetchPracticeProblems,
  fetchProblem,
} from "../services/api";
import {
  addActivity,
  getSolvedSlugs,
  toggleProblemSolved,
  isProblemSolved,
} from "../services/storage";
import type { DailyProblem, ProblemBrief, TopicTag } from "../types";

export default function DailyPage() {
  const navigate = useNavigate();

  // Tab: daily challenge vs practice problems
  const [activeTab, setActiveTab] = useState<"daily" | "practice">("daily");

  // Solved status set for instant UI updates & connected account tracking
  const [solvedSlugsSet, setSolvedSlugsSet] = useState<Set<string>>(() => getSolvedSlugs());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily Challenge state
  const [daily, setDaily] = useState<DailyProblem | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [refreshingDaily, setRefreshingDaily] = useState(false);
  const [dailyError, setDailyError] = useState("");

  // Practice Problems state
  const [topics, setTopics] = useState<TopicTag[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "SOLVED" | "NEW">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [practiceProblems, setPracticeProblems] = useState<ProblemBrief[]>([]);
  const [totalPractice, setTotalPractice] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loadingPractice, setLoadingPractice] = useState<boolean>(false);
  const [practiceError, setPracticeError] = useState<string>("");
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const handleToggleSolved = (slug: string, title?: string) => {
    const isNowSolved = toggleProblemSolved(slug);
    setSolvedSlugsSet(new Set(getSolvedSlugs()));
    setToastMessage(
      isNowSolved
        ? `Marked "${title || slug}" as Solved ✓`
        : `Marked "${title || slug}" as New ★`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Daily Challenge
  const loadDaily = (forceRefresh = false) => {
    if (forceRefresh) setRefreshingDaily(true);
    else setLoadingDaily(true);
    setDailyError("");

    const fetcher = forceRefresh ? refreshDailyChallenge : fetchDailyChallenge;
    fetcher()
      .then((data) => {
        setDaily(data);
        addActivity({
          type: "view",
          problem_slug: data.slug,
          problem_title: data.title,
          timestamp: new Date().toISOString(),
          details: `Viewed Daily Challenge #${data.id} (${data.difficulty})`,
        });
      })
      .catch((e) => setDailyError(e.message || "Failed to load daily problem"))
      .finally(() => {
        setLoadingDaily(false);
        setRefreshingDaily(false);
      });
  };

  // Load Practice Topics & Problems
  const loadTopics = async () => {
    const list = await fetchTopics();
    setTopics(list);
  };

  const loadPractice = (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoadingPractice(true);
    setPracticeError("");

    fetchPracticeProblems({
      difficulty: selectedDifficulty,
      topic: selectedTopic,
      search: searchQuery.trim() || undefined,
      limit: PAGE_SIZE,
      skip: (targetPage - 1) * PAGE_SIZE,
    })
      .then((res) => {
        setPracticeProblems(res.questions || []);
        setTotalPractice(res.total || 0);
      })
      .catch((err) => {
        setPracticeError(err.message || "Failed to load practice problems");
      })
      .finally(() => {
        setLoadingPractice(false);
      });
  };

  useEffect(() => {
    loadDaily();
    loadTopics();
  }, []);

  useEffect(() => {
    if (activeTab === "practice") {
      loadPractice(true);
    }
  }, [activeTab, selectedDifficulty, selectedTopic]);

  // Handle Search on Enter or Click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPractice(true);
  };

  // Open problem in Workspace
  const handleOpenInWorkspace = async (p: ProblemBrief | DailyProblem) => {
    setNavigatingSlug(p.slug);
    try {
      let fullProblem: DailyProblem;
      if ("description" in p && p.description) {
        fullProblem = p as DailyProblem;
      } else {
        fullProblem = await fetchProblem(p.slug);
      }
      navigate("/workspace", { state: { problem: fullProblem } });
    } catch (err: any) {
      alert(`Could not load full problem: ${err.message}`);
    } finally {
      setNavigatingSlug(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalPractice / PAGE_SIZE));

  const displayedSolvedCount = practiceProblems.filter((p) => solvedSlugsSet.has(p.slug)).length;
  const displayedNewCount = practiceProblems.length - displayedSolvedCount;

  const displayedProblems = practiceProblems.filter((p) => {
    const isSolved = solvedSlugsSet.has(p.slug);
    if (selectedStatus === "SOLVED") return isSolved;
    if (selectedStatus === "NEW") return !isSolved;
    return true;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full max-w-full overflow-x-hidden pb-safe relative">
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
          <Sparkles size={16} style={{ color: "var(--color-accent)" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Top Header & Mode Tabs ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Calendar size={22} style={{ color: "var(--color-accent)" }} />
            LeetCode Challenges & Practice
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-muted">
            Official daily problem and practice bank categorized by DSA topic and difficulty.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div
          className="flex items-center p-1 rounded-xl border"
          style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border-subtle)" }}
        >
          <button
            onClick={() => setActiveTab("daily")}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-target flex items-center gap-1.5"
            style={{
              background: activeTab === "daily" ? "var(--color-accent)" : "transparent",
              color: activeTab === "daily" ? "#fff" : "var(--color-text-muted)",
            }}
          >
            <Calendar size={14} />
            <span>Daily Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab("practice")}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-target flex items-center gap-1.5"
            style={{
              background: activeTab === "practice" ? "var(--color-accent)" : "transparent",
              color: activeTab === "practice" ? "#fff" : "var(--color-text-muted)",
            }}
          >
            <BookOpen size={14} />
            <span>Practice Topics</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: DAILY CHALLENGE ─── */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live LeetCode GraphQL Synchronized
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDaily(true)}
                disabled={refreshingDaily || loadingDaily}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all border touch-target disabled:opacity-50"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <RefreshCw size={13} className={refreshingDaily ? "animate-spin" : ""} />
                {refreshingDaily ? "Refreshing..." : "Force Refresh"}
              </button>

              {daily && (
                <button
                  onClick={() => handleOpenInWorkspace(daily)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 touch-target shadow-lg"
                  style={{
                    background: "var(--color-accent)",
                    color: "#fff",
                    boxShadow: "0 0 16px var(--color-accent-glow)",
                  }}
                >
                  <Code2 size={15} />
                  Solve in Workspace
                </button>
              )}
            </div>
          </div>

          {loadingDaily ? (
            <LoadingCard lines={8} />
          ) : dailyError ? (
            <ErrorBox message={dailyError} onRetry={() => loadDaily()} />
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
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <ProblemStatusBadge
                      isSolved={solvedSlugsSet.has(daily.slug)}
                      size="md"
                      showAccountHint={true}
                    />
                    <ProblemStatusToggle
                      isSolved={solvedSlugsSet.has(daily.slug)}
                      onToggle={() => handleToggleSolved(daily.slug, daily.title)}
                    />
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
                <div
                  className="flex flex-wrap items-center gap-1.5 pt-2 border-t"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
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
                  Problem Statement
                </h3>
                <div
                  className="problem-description text-xs sm:text-sm overflow-x-auto break-words leading-relaxed"
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
      )}

      {/* ─── TAB 2: PRACTICE PROBLEMS BY TOPIC & DIFFICULTY ─── */}
      {activeTab === "practice" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className="card p-4 space-y-3"
            style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}
          >
            {/* Search + Topic Dropdown */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems by name or number (e.g. Word Search, 79, Tree)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none text-white focus:border-accent"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                  }}
                />
              </div>

              {/* Topic Select */}
              <div className="sm:w-64">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none text-white cursor-pointer"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <option value="all">All DSA Topics ({topics.length > 0 ? topics.length : "75+"})</option>
                  {topics
                    .filter((t) => t.slug !== "all")
                    .map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer active:scale-95 transition-all shadow-md shrink-0"
                style={{ background: "var(--color-accent)" }}
              >
                Search
              </button>
            </form>

            {/* Status & Difficulty Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
              {/* Status Filter */}
              <span className="text-xs font-semibold text-muted flex items-center gap-1.5 mr-1">
                <CheckCircle size={13} /> Status:
              </span>
              {(["ALL", "SOLVED", "NEW"] as const).map((status) => {
                const isSelected = selectedStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border touch-target flex items-center gap-1.5"
                    style={{
                      background: isSelected ? "var(--color-accent-glow)" : "var(--color-bg-elevated)",
                      borderColor: isSelected
                        ? status === "SOLVED"
                          ? "#10b981"
                          : status === "NEW"
                          ? "#a855f7"
                          : "var(--color-accent)"
                        : "var(--color-border-subtle)",
                      color: isSelected
                        ? status === "SOLVED"
                          ? "#34d399"
                          : status === "NEW"
                          ? "#c084fc"
                          : "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {status === "SOLVED" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {status === "NEW" && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    <span>
                      {status === "ALL"
                        ? `All (${practiceProblems.length})`
                        : status === "SOLVED"
                        ? `Solved (${displayedSolvedCount})`
                        : `New (${displayedNewCount})`}
                    </span>
                  </button>
                );
              })}

              <span className="text-muted mx-1 hidden sm:inline">|</span>

              {/* Difficulty */}
              <span className="text-xs font-semibold text-muted flex items-center gap-1.5 mr-1">
                <SlidersHorizontal size={13} /> Difficulty:
              </span>
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => {
                const isSelected = selectedDifficulty === diff;
                let activeColor = "var(--color-accent)";
                if (diff === "EASY") activeColor = "var(--color-success)";
                if (diff === "MEDIUM") activeColor = "var(--color-warning)";
                if (diff === "HARD") activeColor = "var(--color-danger)";

                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border touch-target"
                    style={{
                      background: isSelected ? "var(--color-accent-glow)" : "var(--color-bg-elevated)",
                      borderColor: isSelected ? activeColor : "var(--color-border-subtle)",
                      color: isSelected ? activeColor : "var(--color-text-secondary)",
                    }}
                  >
                    {diff === "ALL" ? "All Difficulties" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                );
              })}

              <span className="text-xs text-muted ml-auto">
                {loadingPractice ? "Fetching from LeetCode..." : `${totalPractice} problems available`}
              </span>
            </div>
          </div>

          {/* Problems List */}
          {loadingPractice ? (
            <LoadingCard lines={6} />
          ) : practiceError ? (
            <ErrorBox message={practiceError} onRetry={() => loadPractice(false)} />
          ) : displayedProblems.length === 0 ? (
            <div className="card text-center py-10 space-y-2">
              <BookOpen size={30} className="mx-auto text-muted" />
              <h3 className="text-sm font-semibold text-white">No problems found</h3>
              <p className="text-xs text-muted">
                {selectedStatus !== "ALL"
                  ? `No problems match status "${selectedStatus}" in current filter. Try selecting "All (${practiceProblems.length})" or clear filters.`
                  : "Try selecting a different topic, difficulty, or clear your search term."}
              </p>
              {selectedStatus !== "ALL" && (
                <button
                  onClick={() => setSelectedStatus("ALL")}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white"
                >
                  Show All Statuses
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedProblems.map((p) => {
                const isSolved = solvedSlugsSet.has(p.slug);
                return (
                  <div
                    key={p.slug}
                    className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/40 transition-all group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                          #{p.id}
                        </span>
                        <h4
                          className="text-sm font-bold text-white truncate group-hover:text-accent transition-colors cursor-pointer"
                          onClick={() => handleOpenInWorkspace(p)}
                          title={p.title}
                        >
                          {p.title}
                        </h4>
                        <ProblemStatusBadge isSolved={isSolved} size="sm" />
                        <DifficultyBadge difficulty={p.difficulty} />
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-0.2 rounded-md bg-secondary text-secondary border border-border-subtle"
                          >
                            {t}
                          </span>
                        ))}
                        {p.tags.length > 4 && (
                          <span className="text-[10px] text-muted">+{p.tags.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ProblemStatusToggle
                        isSolved={isSolved}
                        onToggle={() => handleToggleSolved(p.slug, p.title)}
                        compact={true}
                      />

                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border text-muted hover:text-white transition-colors cursor-pointer touch-target"
                        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
                        title="Open on LeetCode"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        onClick={() => handleOpenInWorkspace(p)}
                        disabled={navigatingSlug === p.slug}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md touch-target disabled:opacity-50"
                        style={{ background: "var(--color-accent)" }}
                      >
                        {navigatingSlug === p.slug ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Solve in Workspace</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 card">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        setPage((p) => p - 1);
                        loadPractice(false);
                      }
                    }}
                    disabled={page <= 1 || loadingPractice}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span className="text-xs text-muted">
                    Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        setPage((p) => p + 1);
                        loadPractice(false);
                      }
                    }}
                    disabled={page >= totalPages || loadingPractice}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
