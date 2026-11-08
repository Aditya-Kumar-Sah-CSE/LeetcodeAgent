"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { applyUiDensity, getUiDensity } from "@/lib/storage";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    applyUiDensity(getUiDensity());
  }, []);

  const isWorkspace = pathname.startsWith("/workspace");

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
        {children}
      </main>
    </div>
  );
}

