import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import DailyPage from "./pages/DailyPage";
import WorkspacePage from "./pages/WorkspacePage";
import SolutionsPage from "./pages/SolutionsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area (offset by sidebar width) */}
      <main className="flex-1 ml-[68px] sm:ml-[240px] p-4 sm:p-6 transition-all duration-300 overflow-x-hidden min-h-screen">
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
