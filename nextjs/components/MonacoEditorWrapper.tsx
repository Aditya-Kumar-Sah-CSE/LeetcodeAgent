"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { EditorProps } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: "#161822", color: "var(--color-text-secondary)" }}
    >
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      <span className="text-xs font-mono">Loading Monaco Code Editor...</span>
    </div>
  ),
});

export default function MonacoEditorWrapper(props: EditorProps) {
  return <MonacoEditor {...props} />;
}

