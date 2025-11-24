# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

reader3 is a lightweight, self-hosted EPUB reader that displays books one chapter at a time. It's designed to make it easy to copy/paste book content to LLMs for reading assistance.

**Architecture**: Two-part system:
1. **EPUB Processing** ([reader3.py](reader3.py)) - Parses EPUB files into structured data
2. **Web Server** ([server.py](server.py)) - FastAPI app that serves the reader interface

## Common Commands

### Processing a new book
```bash
uv run reader3.py <file.epub>
```
This creates a `<filename>_data/` directory containing:
- `book.pkl` - Pickled Book object with metadata and content
- `images/` - Extracted images from the EPUB

### Running the server
```bash
uv run server.py
```
Server runs at http://127.0.0.1:8123

### Installing dependencies
```bash
uv sync
```

## Data Model Architecture

The core data structures (defined in [reader3.py](reader3.py)):

**Book** - Master object that gets pickled
- `metadata: BookMetadata` - Title, authors, language, etc.
- `spine: List[ChapterContent]` - Linear reading order (physical files)
- `toc: List[TOCEntry]` - Hierarchical navigation tree (logical structure)
- `images: Dict[str, str]` - Maps original paths to local paths

**Key distinction**: EPUB files separate physical content (spine) from logical navigation (TOC). A single spine file may contain multiple TOC chapters. The reader navigates by spine index (0, 1, 2...) while displaying TOC structure for context.

**ChapterContent** - Represents one spine item (physical file)
- Contains both cleaned HTML (`content`) and plain text (`text`)
- Images paths rewritten to point to extracted files
- Dangerous tags (script, style, iframe, etc.) stripped by `clean_html_content()`

**TOCEntry** - Recursive navigation structure
- May point to same file as other TOC entries (different anchors)
- `file_href` is just the filename, `anchor` is the fragment identifier

## Web Server Design

[server.py](server.py) is a FastAPI application:

**Caching**: `@lru_cache` on `load_book_cached()` prevents re-reading pickles on every request (maxsize=10 books)

**Routes**:
- `/` - Library view (scans for `*_data` folders with `book.pkl`)
- `/read/{book_id}/{chapter_index}` - Main reader interface
- `/read/{book_id}/images/{image_name}` - Image serving

**Navigation**: Uses spine indices (0-based integers), not TOC entries. Prev/Next buttons navigate linearly through `book.spine`.

**TOC Mapping**: JavaScript in [templates/reader.html](templates/reader.html) builds a `spineMap` that maps TOC filenames to spine indices, enabling TOC clicks to navigate correctly.

## Template Structure

**[library.html](templates/library.html)** - Grid of book cards with metadata

**[reader.html](templates/reader.html)** - Two-column layout:
- Sidebar: TOC tree (recursive Jinja2 macro) + back-to-library link
- Main: Current chapter content + prev/next navigation
- JavaScript: Maps TOC href clicks to spine indices

## Image Handling

1. EPUB images extracted to `{book}_data/images/` during processing
2. Filenames sanitized (alphanumeric + `._-` only)
3. HTML `<img>` tags rewritten to point to `images/{filename}`
4. Server resolves `/read/{book_id}/images/{name}` to actual files with path sanitization

## Development Notes

- Uses `uv` for dependency management (see [pyproject.toml](pyproject.toml))
- Python 3.10+ required
- No tests, linting, or build process - this is intentionally minimal "vibe coded" project
- Books are managed by simply deleting `*_data` folders
- No database - everything is file-based (pickles + images)
