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
    """Get the solutions directory, checking repo root first then fallback."""
    # Check repository root solutions directory
    repo_solutions = Path(__file__).resolve().parent.parent.parent.parent / "solutions"
    if repo_solutions.exists():
        return repo_solutions

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

    if filepath.exists():
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

    # Check subdirectory folders e.g. YYYY-MM-DD-slug
    ext = LANG_EXTENSIONS.get(language.lower(), ".py")
    for subdir in solutions_dir.iterdir():
        if subdir.is_dir() and (slug in subdir.name):
            subfile = subdir / f"solution{ext}"
            if subfile.exists():
                code = subfile.read_text(encoding="utf-8")
                stat = subfile.stat()
                return SolutionFile(
                    problem_slug=slug,
                    problem_title=slug.replace("-", " ").title(),
                    language=language,
                    filename=subfile.name,
                    code=code,
                    created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                    updated_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                )

    return None


def list_solutions() -> list[SolutionFile]:
    """List all saved solution files from manifest.json and folders."""
    import json
    solutions_dir = _get_solutions_dir()
    solutions: list[SolutionFile] = []
    seen_slugs: set[str] = set()

    # 1. Load from solutions/manifest.json (Online Book entries)
    manifest_path = solutions_dir / "manifest.json"
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_items = json.load(f)
            for item in manifest_items:
                slug = item.get("slug", "")
                if not slug:
                    continue
                seen_slugs.add(slug)
                folder = item.get("folder", "")
                folder_path = solutions_dir / folder if folder else None
                py_path = folder_path / "solution.py" if folder_path else None
                code = item.get("code_python", "")
                if py_path and py_path.exists():
                    try:
                        code = py_path.read_text(encoding="utf-8")
                    except Exception:
                        pass

                solutions.append(SolutionFile(
                    problem_slug=slug,
                    problem_title=item.get("title", slug.replace("-", " ").title()),
                    language="python",
                    filename=f"{slug}.py",
                    code=code,
                    created_at=item.get("solved_at", datetime.now(timezone.utc).isoformat()),
                    updated_at=item.get("solved_at", datetime.now(timezone.utc).isoformat()),
                    id=item.get("id"),
                    difficulty=item.get("difficulty"),
                    tags=item.get("tags"),
                    date=item.get("date"),
                    url=item.get("url"),
                    concept=item.get("concept"),
                    trick_english=item.get("trick_english"),
                    trick_hinglish=item.get("trick_hinglish"),
                    summary_english=item.get("summary_english"),
                    summary_hinglish=item.get("summary_hinglish"),
                    topics_needed=item.get("topics_needed"),
                    stages_summary=item.get("stages_summary"),
                    folder=folder,
                ))
        except Exception as e:
            logger.warning("Error reading manifest.json: %s", e)

    # 2. Check standalone files in solutions_dir
    if solutions_dir.exists():
        for filepath in sorted(solutions_dir.iterdir()):
            if filepath.is_file() and filepath.suffix in LANG_EXTENSIONS.values():
                slug = filepath.stem
                if slug in seen_slugs:
                    continue
                code = filepath.read_text(encoding="utf-8")
                stat = filepath.stat()
                ext = filepath.suffix
                language = next(
                    (lang for lang, e in LANG_EXTENSIONS.items() if e == ext),
                    "python"
                )

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
