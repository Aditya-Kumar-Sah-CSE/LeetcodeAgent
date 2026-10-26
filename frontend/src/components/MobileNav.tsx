import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  BrainCircuit,
  FolderCode,
  Activity,
  Settings,
  Menu,
  X,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getUsername } from "../services/storage";
import { InstallPwaButton } from "./InstallPwaPrompt";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/daily", icon: Calendar, label: "Daily" },
  { to: "/workspace", icon: BrainCircuit, label: "Workspace" },
  { to: "/solutions", icon: FolderCode, label: "Solutions" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const ALL_DRAWER_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/daily", icon: Calendar, label: "Daily Challenge" },
  { to: "/workspace", icon: BrainCircuit, label: "AI Workspace" },
  { to: "/solutions", icon: FolderCode, label: "My Solutions" },
  { to: "/activity", icon: Activity, label: "Activity Log" },
  { to: "/settings", icon: Settings, label: "Settings & Profile" },
];

export default function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const username = getUsername();

  return (
    <>
      {/* ─── Top App Bar (Mobile & Tablet < 768px) ─── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-3 border-b backdrop-blur-md"
        style={{
          background: "rgba(22, 24, 34, 0.92)",
          borderColor: "var(--color-border-subtle)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #a78bfa)" }}
          >
            <Zap size={15} color="#fff" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            LeetCode Agent
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <InstallPwaButton variant="compact" />
          {username && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full truncate max-w-[100px] xs:max-w-[120px]"
              style={{
                background: "var(--color-bg-elevated)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              @{username}
            </span>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Drawer"
            className="p-2 rounded-lg text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ─── Slide-over Mobile Drawer ─── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-[280px] max-w-[85vw] h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200"
            style={{ background: "var(--color-bg-secondary)", borderRight: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), #a78bfa)" }}
                >
                  <Zap size={18} color="#fff" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">LeetCode Agent</div>
                  <div className="text-[11px] text-muted">Local-First AI Workspace</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center"
                aria-label="Close Navigation Drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* PWA Install Drawer Banner */}
            <div className="mt-3">
              <InstallPwaButton variant="drawer" />
            </div>

            {/* User Profile Pill in Drawer */}
            <div
              className="my-3 p-2.5 rounded-xl border flex items-center gap-2.5"
              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border-subtle)" }}
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xs">
                {username ? username[0]?.toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {username || "Aditya_Kumar_Sah-28"}
                </div>
                <a
                  href={`https://leetcode.com/u/${username || "Aditya_Kumar_Sah-28"}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-accent flex items-center gap-1 hover:underline"
                >
                  LeetCode Profile <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto py-2">
              {ALL_DRAWER_ITEMS.map(({ to, icon: Icon, label }) => {
                const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium transition-colors touch-target"
                    style={{
                      background: isActive ? "var(--color-accent-glow)" : "transparent",
                      color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t text-[11px] text-muted" style={{ borderColor: "var(--color-border-subtle)" }}>
              v1.0.0 · Mobile Optimized
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation Bar (Mobile & Tablet < 768px) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around border-t backdrop-blur-lg"
        style={{
          background: "rgba(22, 24, 34, 0.95)",
          borderColor: "var(--color-border-subtle)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center h-full py-1 text-center transition-all touch-target"
              style={{
                color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
            >
              <div
                className="p-1 rounded-full transition-transform"
                style={{
                  background: isActive ? "var(--color-accent-glow)" : "transparent",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
