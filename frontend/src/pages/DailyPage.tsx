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
  Trophy,
  Clock,
  Play,
  Square,
  Award,
  Flame,
  Timer,
  Pause,
} from "lucide-react";
import DifficultyBadge, {
  LoadingCard,
  ErrorBox,
  ProblemStatusBadge,
} from "../components/UIComponents";
import {
  fetchDailyChallenge,
  refreshDailyChallenge,
  fetchTopics,
  fetchPracticeProblems,
  fetchProblem,
  fetchContests,
  fetchContestQuestions,
  syncLeetCodeSolvedProblems,
} from "../services/api";
import {
  addActivity,
  getSolvedSlugs,
  isProblemSolved,
  getLastSyncTime,
  formatLastSyncTime,
} from "../services/storage";
import type { DailyProblem, ProblemBrief, TopicTag, ContestBrief, ContestQuestion } from "../types";

export default function DailyPage() {
  const navigate = useNavigate();

  // Tab: daily challenge vs practice problems vs live/virtual contest
  const [activeTab, setActiveTab] = useState<"daily" | "practice" | "contest">("daily");

  // Solved status set for instant UI updates & connected account tracking
  const [solvedSlugsSet, setSolvedSlugsSet] = useState<Set<string>>(() => getSolvedSlugs());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(() => getLastSyncTime());

  // Contest Arena state
  const [contests, setContests] = useState<ContestBrief[]>([]);
  const [loadingContests, setLoadingContests] = useState<boolean>(false);
  const [contestError, setContestError] = useState<string>("");
  const [selectedContestSlug, setSelectedContestSlug] = useState<string>("weekly-contest-525");
  const [contestQuestions, setContestQuestions] = useState<ContestQuestion[]>([]);
  const [loadingContestQuestions, setLoadingContestQuestions] = useState<boolean>(false);
  const [contestSubTab, setContestSubTab] = useState<"virtual" | "upcoming" | "all">("virtual");

  // Virtual Contest Simulator state
  const [isVirtualActive, setIsVirtualActive] = useState<boolean>(false);
  const [virtualSecondsLeft, setVirtualSecondsLeft] = useState<number>(5400); // 90 min default
  const [virtualPaused, setVirtualPaused] = useState<boolean>(false);

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

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncLeetCodeSolvedProblems(true);
      setSolvedSlugsSet(new Set(getSolvedSlugs()));
      setLastSyncTimeState(res.lastSyncedAt);
      setToastMessage(
        `✓ Synced with @Aditya_Kumar_Sah-28! (${res.count} solved problems active)`
      );
    } catch (e: any) {
      setToastMessage(`Failed to sync: ${e.message || "Network error"}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
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
    // Automatic 24-hour sync from connected LeetCode profile
    syncLeetCodeSolvedProblems(false).then((res) => {
      if (res.synced) {
        setSolvedSlugsSet(new Set(getSolvedSlugs()));
        setLastSyncTimeState(res.lastSyncedAt);
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === "practice") {
      loadPractice(true);
    }
  }, [activeTab, selectedDifficulty, selectedTopic]);

  // Load Contests & Questions
  const loadContests = async () => {
    setLoadingContests(true);
    setContestError("");
    try {
      const list = await fetchContests();
      setContests(list);
      const firstPast = list.find((c) => c.status === "PAST");
      const defaultSlug = firstPast ? firstPast.slug : (list[0]?.slug || "weekly-contest-525");
      setSelectedContestSlug(defaultSlug);
      loadContestQuestions(defaultSlug);
    } catch (e: any) {
      setContestError(e.message || "Failed to load contests");
    } finally {
      setLoadingContests(false);
    }
  };

  const loadContestQuestions = async (slug: string) => {
    setLoadingContestQuestions(true);
    try {
      const qs = await fetchContestQuestions(slug);
      setContestQuestions(qs);
    } catch (e: any) {
      setContestError(e.message || "Failed to load contest questions");
    } finally {
      setLoadingContestQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "contest" && contests.length === 0) {
      loadContests();
    }
  }, [activeTab]);

  // Virtual contest countdown timer
  useEffect(() => {
    let timer: any = null;
    if (isVirtualActive && !virtualPaused && virtualSecondsLeft > 0) {
      timer = setInterval(() => {
        setVirtualSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsVirtualActive(false);
            setToastMessage("⏱️ Virtual Contest Time is up! Great effort!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVirtualActive, virtualPaused, virtualSecondsLeft]);

  const handleSelectContest = (slug: string) => {
    setSelectedContestSlug(slug);
    loadContestQuestions(slug);
    if (isVirtualActive) {
      setVirtualSecondsLeft(5400);
    }
  };

  const handleStartVirtualContest = () => {
    setIsVirtualActive(true);
    setVirtualPaused(false);
    setVirtualSecondsLeft(5400); // 90 mins
    setToastMessage(`⚡ Virtual Contest Started for ${selectedContest?.title || selectedContestSlug}! 90m on the clock.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFinishVirtualContest = () => {
    setIsVirtualActive(false);
    setToastMessage(`🏆 Virtual Contest Completed! You scored ${userContestPoints} / ${totalContestPoints} pts.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatContestTime = (ts: number) => {
    try {
      const d = new Date(ts * 1000);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Scheduled";
    }
  };

  // Open contest question in workspace
  const handleOpenContestQuestion = async (q: ContestQuestion) => {
    setNavigatingSlug(q.slug);
    try {
      const fullProblem = await fetchProblem(q.slug);
      navigate("/workspace", { state: { problem: fullProblem } });
    } catch (err: any) {
      alert(`Could not load full problem: ${err.message}`);
    } finally {
      setNavigatingSlug(null);
    }
  };

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

  const selectedContest = contests.find((c) => c.slug === selectedContestSlug);
  const totalContestPoints = contestQuestions.reduce((acc, q) => acc + (q.credit || 0), 0) || 18;
  const userContestPoints = contestQuestions
    .filter((q) => solvedSlugsSet.has(q.slug))
    .reduce((acc, q) => acc + (q.credit || 0), 0);
  const userSolvedContestCount = contestQuestions.filter((q) => solvedSlugsSet.has(q.slug)).length;

  const upcomingContests = contests.filter((c) => c.status === "UPCOMING" || c.status === "LIVE");
  const pastContests = contests.filter((c) => c.status === "PAST");

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
          className="flex items-center p-1 rounded-xl border flex-wrap gap-1"
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

          <button
            onClick={() => setActiveTab("contest")}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-target flex items-center gap-1.5"
            style={{
              background: activeTab === "contest" ? "var(--color-accent)" : "transparent",
              color: activeTab === "contest" ? "#fff" : "var(--color-text-muted)",
            }}
          >
            <Trophy size={14} />
            <span>Live & Virtual Contests</span>
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
                onClick={handleManualSync}
                disabled={syncing}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border touch-target disabled:opacity-50"
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  borderColor: "rgba(16, 185, 129, 0.35)",
                  color: "#34d399",
                }}
                title="Sync accepted submissions from connected LeetCode profile (@Aditya_Kumar_Sah-28)"
              >
                <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                <span>{syncing ? "Syncing..." : "Sync Solved"}</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">
                  ({formatLastSyncTime(lastSyncTime)})
                </span>
              </button>

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

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 touch-target"
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    borderColor: "rgba(16, 185, 129, 0.35)",
                    color: "#34d399",
                  }}
                  title="Sync accepted submissions from connected LeetCode profile (@Aditya_Kumar_Sah-28)"
                >
                  <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                  <span>{syncing ? "Syncing..." : "Sync Solved"}</span>
                  <span className="text-[10px] opacity-80 hidden md:inline">
                    ({formatLastSyncTime(lastSyncTime)})
                  </span>
                </button>
                <span className="text-xs text-muted hidden sm:inline">
                  {loadingPractice ? "Fetching from LeetCode..." : `${totalPractice} problems available`}
                </span>
              </div>
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

      {/* ─── TAB 3: LIVE & VIRTUAL CONTESTS ─── */}
      {activeTab === "contest" && (
        <div className="space-y-5">
          {/* Contest Arena Top Banner Card */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="p-2.5 rounded-xl text-accent shrink-0 border"
                  style={{
                    background: "rgba(99, 102, 241, 0.15)",
                    borderColor: "rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <Trophy size={20} />
                </span>
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    LeetCode Contest Arena & Simulator
                  </h2>
                  <p className="text-xs text-muted">
                    Official LeetCode Weekly & Biweekly Contests. Solve live or enter 90-minute Virtual Contest simulation mode with auto-scoring.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadContests()}
                  disabled={loadingContests}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all border touch-target disabled:opacity-50"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <RefreshCw size={13} className={loadingContests ? "animate-spin" : ""} />
                  {loadingContests ? "Syncing..." : "Sync Contests"}
                </button>

                <a
                  href="https://leetcode.com/contest/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border text-accent touch-target hover:scale-105 transition-all"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <ExternalLink size={13} />
                  Official Hub
                </a>
              </div>
            </div>

            {/* Sub-Tabs: Virtual Simulator | Live & Upcoming | Contest Bank */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
              <button
                onClick={() => setContestSubTab("virtual")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 touch-target"
                style={{
                  background: contestSubTab === "virtual" ? "var(--color-accent)" : "var(--color-bg-elevated)",
                  color: contestSubTab === "virtual" ? "#fff" : "var(--color-text-secondary)",
                  borderColor: contestSubTab === "virtual" ? "var(--color-accent)" : "var(--color-border-subtle)",
                }}
              >
                <Timer size={14} />
                <span>Virtual Contest Simulator</span>
              </button>

              <button
                onClick={() => setContestSubTab("upcoming")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 touch-target"
                style={{
                  background: contestSubTab === "upcoming" ? "var(--color-accent)" : "var(--color-bg-elevated)",
                  color: contestSubTab === "upcoming" ? "#fff" : "var(--color-text-secondary)",
                  borderColor: contestSubTab === "upcoming" ? "var(--color-accent)" : "var(--color-border-subtle)",
                }}
              >
                <Clock size={14} />
                <span>Live & Upcoming ({upcomingContests.length})</span>
              </button>

              <button
                onClick={() => setContestSubTab("all")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 touch-target"
                style={{
                  background: contestSubTab === "all" ? "var(--color-accent)" : "var(--color-bg-elevated)",
                  color: contestSubTab === "all" ? "#fff" : "var(--color-text-secondary)",
                  borderColor: contestSubTab === "all" ? "var(--color-accent)" : "var(--color-border-subtle)",
                }}
              >
                <Award size={14} />
                <span>Past Contest Bank ({pastContests.length})</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Virtual Contest Simulator */}
          {contestSubTab === "virtual" && (
            <div className="space-y-4">
              {/* Simulator Control & Scoreboard Card */}
              <div
                className="card p-4 sm:p-5 space-y-4 border"
                style={{
                  borderColor: isVirtualActive ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.25)",
                  background: isVirtualActive
                    ? "linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, var(--color-bg-card) 100%)"
                    : undefined,
                }}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Contest Selector */}
                  <div className="space-y-1 w-full md:w-auto">
                    <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                      <Trophy size={13} className="text-accent" /> Select Contest to Simulate:
                    </label>
                    <select
                      value={selectedContestSlug}
                      onChange={(e) => handleSelectContest(e.target.value)}
                      disabled={isVirtualActive}
                      className="w-full md:w-80 px-3 py-2 text-xs font-bold rounded-xl border outline-none text-white cursor-pointer"
                      style={{
                        background: "var(--color-bg-primary)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      {contests
                        .filter((c) => c.status === "PAST")
                        .map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.title} (4 Problems · 90m)
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Simulator Controls & Timer */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Live Clock Display */}
                    <div
                      className="px-4 py-2 rounded-xl border flex items-center gap-2 font-mono"
                      style={{
                        background: "var(--color-bg-primary)",
                        borderColor: isVirtualActive ? "var(--color-success)" : "var(--color-border-subtle)",
                        color: isVirtualActive ? "#34d399" : "var(--color-text-secondary)",
                      }}
                    >
                      <Timer size={16} className={isVirtualActive && !virtualPaused ? "animate-spin" : ""} />
                      <span className="text-base sm:text-lg font-bold tracking-wider">
                        {formatTimer(virtualSecondsLeft)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {!isVirtualActive ? (
                      <button
                        onClick={handleStartVirtualContest}
                        className="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 text-white cursor-pointer active:scale-95 transition-all shadow-lg touch-target"
                        style={{
                          background: "var(--color-accent)",
                          boxShadow: "0 0 16px var(--color-accent-glow)",
                        }}
                      >
                        <Play size={14} />
                        Start Virtual Contest (90m)
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setVirtualPaused((p) => !p)}
                          className="px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 cursor-pointer touch-target"
                          style={{
                            background: "var(--color-bg-elevated)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {virtualPaused ? <Play size={13} /> : <Pause size={13} />}
                          <span>{virtualPaused ? "Resume" : "Pause"}</span>
                        </button>

                        <button
                          onClick={handleFinishVirtualContest}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 text-white cursor-pointer active:scale-95 transition-all touch-target"
                          style={{ background: "var(--color-danger)" }}
                        >
                          <Square size={13} />
                          <span>Finish Contest</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Virtual Scoreboard Row */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border text-xs"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Award size={15} className="text-accent" />
                      Virtual Score:{" "}
                      <strong className="text-emerald-400 text-sm">{userContestPoints}</strong> / {totalContestPoints} pts
                    </span>
                    <span className="text-muted">|</span>
                    <span className="text-secondary">
                      Problems Solved: <strong className="text-white">{userSolvedContestCount}</strong> / {contestQuestions.length}
                    </span>
                    <span className="text-muted">|</span>
                    <span className="text-secondary">
                      Contest Duration: <strong className="text-white">90 mins</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-muted flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isVirtualActive ? "bg-emerald-400 animate-pulse" : "bg-purple-400"}`} />
                    {isVirtualActive ? "Simulating Live Contest Environment" : "Ready to Start Virtual Simulation"}
                  </span>
                </div>
              </div>

              {/* Contest Questions (Q1 - Q4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Trophy size={16} className="text-accent" />
                    Contest Problems: {selectedContest?.title || selectedContestSlug}
                  </h3>
                  <span className="text-xs text-muted">
                    {contestQuestions.length} Questions (Q1 to Q4)
                  </span>
                </div>

                {loadingContestQuestions ? (
                  <LoadingCard lines={4} />
                ) : contestQuestions.length === 0 ? (
                  <div className="card text-center py-8 text-muted text-xs">
                    No questions found for this contest. Select another contest above.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {contestQuestions.map((q, idx) => {
                      const isSolved = solvedSlugsSet.has(q.slug);
                      return (
                        <div
                          key={q.slug}
                          className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/40 transition-all group"
                          style={{
                            borderColor: isSolved ? "rgba(16, 185, 129, 0.3)" : undefined,
                          }}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                                Q{idx + 1}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-elevated text-secondary border border-border-subtle">
                                {q.credit} Points
                              </span>
                              <h4
                                className="text-sm font-bold text-white truncate group-hover:text-accent transition-colors cursor-pointer"
                                onClick={() => handleOpenContestQuestion(q)}
                                title={q.title}
                              >
                                {q.title}
                              </h4>
                              <ProblemStatusBadge isSolved={isSolved} size="sm" />
                              <DifficultyBadge difficulty={q.difficulty} />
                            </div>

                            <p className="text-xs text-muted">
                              LeetCode Contest Problem #{q.id} · Worth {q.credit} contest rating points
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={q.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg border text-muted hover:text-white transition-colors cursor-pointer touch-target"
                              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
                              title="Open on LeetCode"
                            >
                              <ExternalLink size={14} />
                            </a>

                            <button
                              onClick={() => handleOpenContestQuestion(q)}
                              disabled={navigatingSlug === q.slug}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md touch-target disabled:opacity-50"
                              style={{ background: "var(--color-accent)" }}
                            >
                              {navigatingSlug === q.slug ? (
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
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Live & Upcoming Contests */}
          {contestSubTab === "upcoming" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  Upcoming & Live LeetCode Contests
                </h3>
                <span className="text-xs text-muted">
                  Weekly (every Sunday) & Biweekly (every alternate Saturday)
                </span>
              </div>

              {upcomingContests.length === 0 ? (
                <div className="card text-center py-10 space-y-2">
                  <Clock size={28} className="mx-auto text-muted" />
                  <p className="text-sm text-white font-semibold">No upcoming contests scheduled currently.</p>
                  <p className="text-xs text-muted">Check back soon or explore past contests in the Virtual Contest Simulator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {upcomingContests.map((c) => (
                    <div
                      key={c.slug}
                      className="card p-4 space-y-3 border hover:border-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              c.status === "LIVE"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-accent/15 text-accent border border-accent/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === "LIVE" ? "bg-red-400 animate-pulse" : "bg-accent"}`} />
                            {c.status === "LIVE" ? "LIVE NOW" : "UPCOMING"}
                          </span>
                          <h4 className="text-base font-bold text-white">{c.title}</h4>
                        </div>

                        <span className="text-xs text-muted font-mono">
                          90 Minutes
                        </span>
                      </div>

                      <div className="text-xs text-secondary space-y-1 pt-1 border-t border-border-subtle">
                        <div>
                          <span className="text-muted">Start Time: </span>
                          <span className="text-white font-medium">{formatContestTime(c.start_time)}</span>
                        </div>
                        <div>
                          <span className="text-muted">Format: </span>
                          <span>4 Algorithm Problems (Easy to Hard)</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-md text-white"
                          style={{ background: "var(--color-accent)" }}
                        >
                          <ExternalLink size={13} />
                          {c.status === "LIVE" ? "Enter Live Contest on LeetCode" : "Register / View on LeetCode"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Past Contest Bank */}
          {contestSubTab === "all" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Award size={16} className="text-accent" />
                  Past Contests Archive
                </h3>
                <span className="text-xs text-muted">
                  Select any contest to load its 4 problems into the simulator or AI workspace
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pastContests.slice(0, 30).map((c) => {
                  const isSelected = selectedContestSlug === c.slug;
                  return (
                    <div
                      key={c.slug}
                      className="card p-3.5 space-y-2.5 transition-all cursor-pointer border hover:border-accent"
                      style={{
                        borderColor: isSelected ? "var(--color-accent)" : undefined,
                        background: isSelected ? "var(--color-accent-glow)" : undefined,
                      }}
                      onClick={() => {
                        handleSelectContest(c.slug);
                        setContestSubTab("virtual");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white truncate">{c.title}</h4>
                        <span className="text-[11px] font-mono text-muted">90m</span>
                      </div>

                      <p className="text-xs text-muted">
                        Date: {formatContestTime(c.start_time)}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                        <span className="text-[11px] text-accent font-semibold">
                          {isSelected ? "Currently Selected ✓" : "Click to Simulate"}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
