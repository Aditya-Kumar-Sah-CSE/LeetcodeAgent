"""
Tests for AI Assistant Chat Persistence and Git synchronization service.
"""

import json
from pathlib import Path
from app.services.chat_service import (
    save_chat_history,
    get_chat_history,
    format_markdown_chat_log,
)


def test_format_markdown_chat_log():
    messages = [
        {
            "id": "1",
            "role": "user",
            "content": "__builtin_popcount ye kr h bhai",
            "timestamp": 1729930000000,
        },
        {
            "id": "2",
            "role": "assistant",
            "content": "Haan bhai, __builtin_popcount binary set bits count karta hai.",
            "reasoning": "Inspected C++ code and checked builtin",
            "tool_calls": [
                {
                    "name": "lookup_builtin",
                    "label": "lookup_builtin(__builtin_popcount)",
                    "result": "O(1) CPU instruction",
                }
            ],
            "timestamp": 1729930002000,
        },
    ]

    md = format_markdown_chat_log("binary-digit-score", "Binary Digit Score", messages)
    assert "# AI Assistant Conversation: Binary Digit Score" in md
    assert "### 👤 User" in md
    assert "__builtin_popcount ye kr h bhai" in md
    assert "### 🤖 AI Assistant" in md
    assert "Agent Reasoning & Tool Calls" in md
    assert "lookup_builtin" in md


def test_save_and_get_chat_history(tmp_path, monkeypatch):
    # Monkeypatch solutions directory to tmp_path
    monkeypatch.setattr("app.services.chat_service._get_solutions_dir", lambda: tmp_path)

    messages = [
        {
            "id": "msg-101",
            "role": "user",
            "content": "Explain binary digit score algorithm",
            "timestamp": 1729930000000,
        },
        {
            "id": "msg-102",
            "role": "assistant",
            "content": "Binary digit score algorithm breakdown...",
            "reasoning": "Step 1: Check constraints",
            "tool_calls": [],
            "timestamp": 1729930005000,
        },
    ]

    res = save_chat_history("test-binary-score", messages, "Test Binary Score", push_to_git=False)
    assert res["status"] == "ok"
    assert res["count"] == 2

    # Verify retrieval
    retrieved = get_chat_history("test-binary-score")
    assert retrieved is not None
    assert retrieved["slug"] == "test-binary-score"
    assert len(retrieved["messages"]) == 2
    assert retrieved["messages"][0]["content"] == "Explain binary digit score algorithm"
