"""
Solution file management service.
Handles creating, reading, and managing local solution files.
"""

import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import SolutionFile, SaveSolutionRequest
from app.core.config import settings

logger = logging.getLogger(__name__)

# Language to file extension mapping
LANG_EXTENSIONS = {
    "python": ".py",
    "python3": ".py",
    "cpp": ".cpp",
    "c++": ".cpp",
    "java": ".java",
    "javascript": ".js",
    "typescript": ".ts",
}


def _get_solutions_dir() -> Path:
    """Get the solutions directory, creating if needed."""
    solutions_dir = Path(settings.SOLUTIONS_DIR).resolve()
    solutions_dir.mkdir(parents=True, exist_ok=True)
    return solutions_dir


def _make_filename(slug: str, language: str) -> str:
    """Create a filename from problem slug and language."""
    ext = LANG_EXTENSIONS.get(language.lower(), ".py")
    return f"{slug}{ext}"


def save_solution(request: SaveSolutionRequest) -> SolutionFile:
    """Save a solution to a local file."""
    solutions_dir = _get_solutions_dir()
    filename = _make_filename(request.problem_slug, request.language)
    filepath = solutions_dir / filename

    now = datetime.now(timezone.utc).isoformat()

    # Write the solution file
    filepath.write_text(request.code, encoding="utf-8")

    logger.info("Saved solution: %s", filepath)

    return SolutionFile(
        problem_slug=request.problem_slug,
        problem_title=request.problem_title,
        language=request.language,
        filename=filename,
        code=request.code,
        created_at=now,
        updated_at=now,
    )


def get_solution(slug: str, language: str) -> SolutionFile | None:
    """Get a saved solution file."""
    solutions_dir = _get_solutions_dir()
    filename = _make_filename(slug, language)
    filepath = solutions_dir / filename

    if not filepath.exists():
        return None

    code = filepath.read_text(encoding="utf-8")
    stat = filepath.stat()

    return SolutionFile(
        problem_slug=slug,
        problem_title=slug.replace("-", " ").title(),
        language=language,
        filename=filename,
        code=code,
        created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
        updated_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    )


def list_solutions() -> list[SolutionFile]:
    """List all saved solution files."""
    solutions_dir = _get_solutions_dir()
    solutions = []

    if not solutions_dir.exists():
        return solutions

    for filepath in sorted(solutions_dir.iterdir()):
        if filepath.is_file() and filepath.suffix in LANG_EXTENSIONS.values():
            code = filepath.read_text(encoding="utf-8")
            stat = filepath.stat()

            # Infer language from extension
            ext = filepath.suffix
            language = next(
                (lang for lang, e in LANG_EXTENSIONS.items() if e == ext),
                "python"
            )
            slug = filepath.stem

            solutions.append(SolutionFile(
                problem_slug=slug,
                problem_title=slug.replace("-", " ").title(),
                language=language,
                filename=filepath.name,
                code=code,
                created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                updated_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            ))

    return solutions


def delete_solution(slug: str, language: str) -> bool:
    """Delete a solution file."""
    solutions_dir = _get_solutions_dir()
    filename = _make_filename(slug, language)
    filepath = solutions_dir / filename

    if filepath.exists():
        filepath.unlink()
        logger.info("Deleted solution: %s", filepath)
        return True
    return False


def solution_exists(slug: str, language: str) -> bool:
    """Check if a solution file already exists."""
    solutions_dir = _get_solutions_dir()
    filename = _make_filename(slug, language)
    return (solutions_dir / filename).exists()
