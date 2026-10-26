import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import DashboardPage from "./pages/DashboardPage";
import DailyPage from "./pages/DailyPage";
import WorkspacePage from "./pages/WorkspacePage";
import SolutionsPage from "./pages/SolutionsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Remember active route on navigation for reload persistence
  useEffect(() => {
    if (location.pathname && location.pathname !== "/") {
      localStorage.setItem("lca-last-route", location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  // Restore last active route if opened at root "/"
  useEffect(() => {
    if (location.pathname === "/" && !location.search) {
      const savedRoute = localStorage.getItem("lca-last-route");
      if (savedRoute && savedRoute !== "/" && !savedRoute.startsWith("/#")) {
        navigate(savedRoute, { replace: true });
      }
    }
  }, []);

  const isWorkspace = location.pathname.startsWith("/workspace");

  return (
    <div
      className={`w-full max-w-full ${
        isWorkspace
          ? "h-screen max-h-screen overflow-hidden flex flex-col md:flex-row"
          : "min-h-screen flex flex-col md:flex-row overflow-x-hidden"
      }`}
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Mobile Top App Bar, Drawer, and Bottom Nav Bar */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 w-full min-w-0 max-w-full ${
          isWorkspace
            ? "h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden pt-14 md:pt-2.5 px-2 sm:px-3 pb-1 md:pb-2 flex flex-col min-h-0"
            : "overflow-x-hidden pt-16 md:pt-6 px-3 sm:px-6 pb-24 md:pb-8 min-h-screen"
        } ${sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[240px]"}`}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
