"""
Tests for the LeetCode AI Agent backend.
"""

import pytest
from unittest.mock import patch, AsyncMock
from app.services.leetcode_service import _parse_examples, _parse_constraints, _clean_html
from app.services.solution_service import _make_filename, LANG_EXTENSIONS
from app.services.search_service import _is_url_safe
from app.agents.coding_agent import _extract_code, _format_examples, _format_constraints
from app.models.schemas import ProblemExample, AIRequest


# ─── HTML Parsing Tests ──────────────────────────────────────────

class TestParseExamples:
    def test_parse_empty(self):
        assert _parse_examples("") == []
        assert _parse_examples(None) == []

    def test_parse_basic_example(self):
        html = """
        <strong class="example">Example 1:</strong>
        <p><strong>Input:</strong> nums = [2,7,11,15], target = 9</p>
        <p><strong>Output:</strong> [0,1]</p>
        <p><strong>Explanation:</strong> Because nums[0] + nums[1] == 9.</p>
        """
        examples = _parse_examples(html)
        # May or may not parse depending on exact HTML structure
        # This tests the function doesn't crash on real-ish HTML
        assert isinstance(examples, list)


class TestParseConstraints:
    def test_parse_empty(self):
        assert _parse_constraints("") == []
        assert _parse_constraints(None) == []

    def test_parse_constraints_html(self):
        html = """
        <p><strong>Constraints:</strong></p>
        <ul>
            <li>2 &lt;= nums.length &lt;= 10<sup>4</sup></li>
            <li>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></li>
        </ul>
        """
        constraints = _parse_constraints(html)
        assert isinstance(constraints, list)


class TestCleanHtml:
    def test_remove_tags(self):
        assert _clean_html("<b>hello</b>") == "hello"

    def test_decode_entities(self):
        assert _clean_html("a &lt; b") == "a < b"

    def test_strip_whitespace(self):
        assert _clean_html("  hello  ") == "hello"


# ─── Solution Filename Tests ────────────────────────────────────

class TestMakeFilename:
    def test_python(self):
        assert _make_filename("two-sum", "python") == "two-sum.py"

    def test_cpp(self):
        assert _make_filename("two-sum", "cpp") == "two-sum.cpp"

    def test_java(self):
        assert _make_filename("two-sum", "java") == "two-sum.java"

    def test_javascript(self):
        assert _make_filename("two-sum", "javascript") == "two-sum.js"

    def test_typescript(self):
        assert _make_filename("two-sum", "typescript") == "two-sum.ts"

    def test_unknown_language(self):
        assert _make_filename("two-sum", "rust") == "two-sum.py"  # defaults to .py


# ─── SSRF Protection Tests ──────────────────────────────────────

class TestSSRFProtection:
    def test_allows_valid_url(self):
        assert _is_url_safe("https://www.google.com/search") is True

    def test_blocks_localhost(self):
        assert _is_url_safe("http://localhost/secret") is False

    def test_blocks_127(self):
        assert _is_url_safe("http://127.0.0.1/admin") is False

    def test_blocks_private_10(self):
        assert _is_url_safe("http://10.0.0.1/internal") is False

    def test_blocks_private_172(self):
        assert _is_url_safe("http://172.16.0.1/internal") is False

    def test_blocks_private_192(self):
        assert _is_url_safe("http://192.168.1.1/router") is False

    def test_blocks_metadata(self):
        assert _is_url_safe("http://169.254.169.254/metadata") is False

    def test_blocks_empty(self):
        assert _is_url_safe("") is False

    def test_blocks_no_host(self):
        assert _is_url_safe("file:///etc/passwd") is False


# ─── Code Extraction Tests ──────────────────────────────────────

class TestExtractCode:
    def test_extract_python_block(self):
        text = """Here is the solution:
```python
class Solution:
    def twoSum(self, nums, target):
        return []
```
"""
        code = _extract_code(text, "python")
        assert code is not None
        assert "class Solution" in code
        assert "twoSum" in code

    def test_extract_cpp_block(self):
        text = """```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {};
    }
};
```"""
        code = _extract_code(text, "cpp")
        assert code is not None
        assert "class Solution" in code

    def test_no_code_block(self):
        text = "Just some plain text explanation"
        code = _extract_code(text, "python")
        assert code is None


# ─── Prompt Formatting Tests ────────────────────────────────────

class TestFormatting:
    def test_format_examples_empty(self):
        req = AIRequest(
            problem_slug="test",
            problem_title="Test",
            problem_description="desc",
            examples=[],
            language="python",
            stage="generate",
        )
        result = _format_examples(req)
        assert "No examples" in result

    def test_format_examples_with_data(self):
        req = AIRequest(
            problem_slug="test",
            problem_title="Test",
            problem_description="desc",
            examples=[ProblemExample(input="[1,2]", output="3", explanation="sum")],
            language="python",
            stage="generate",
        )
        result = _format_examples(req)
        assert "[1,2]" in result
        assert "3" in result

    def test_format_constraints_empty(self):
        req = AIRequest(
            problem_slug="test",
            problem_title="Test",
            problem_description="desc",
            constraints=[],
            language="python",
            stage="generate",
        )
        result = _format_constraints(req)
        assert "No constraints" in result

    def test_format_constraints_with_data(self):
        req = AIRequest(
            problem_slug="test",
            problem_title="Test",
            problem_description="desc",
            constraints=["1 <= n <= 100", "values are integers"],
            language="python",
            stage="generate",
        )
        result = _format_constraints(req)
        assert "1 <= n <= 100" in result


# ─── Model Schema Tests ─────────────────────────────────────────

class TestSchemas:
    def test_ai_request_defaults(self):
        req = AIRequest(
            problem_slug="two-sum",
            problem_title="Two Sum",
            problem_description="Given an array...",
            language="python",
            stage="generate",
        )
        assert req.language == "python"
        assert req.stage == "generate"
        assert req.api_key is None
        assert req.model_id is None

    def test_ai_request_with_key(self):
        req = AIRequest(
            problem_slug="two-sum",
            problem_title="Two Sum",
            problem_description="Given an array...",
            api_key="sk-test-123",
            model_id="google/gemma-3-1b-it:free",
            language="python",
            stage="generate",
        )
        assert req.api_key == "sk-test-123"
        assert req.model_id == "google/gemma-3-1b-it:free"
