#!/usr/bin/env python3
"""
Convert pickle book data to JSON format for Cloudflare Workers deployment.

Usage:
    python scripts/convert-to-json.py <book_data_folder>

Example:
    python scripts/convert-to-json.py dracula_data
"""

import os
import sys
import json
import pickle
import shutil
from pathlib import Path


def convert_book_to_json(book_data_folder: str):
    """
    Convert a book's pickle data to JSON format.

    Args:
        book_data_folder: Path to the book data folder (e.g., 'dracula_data')
    """
    # Check if folder exists
    if not os.path.exists(book_data_folder):
        print(f"❌ Error: Folder '{book_data_folder}' not found")
        return False

    pickle_path = os.path.join(book_data_folder, 'book.pkl')
    if not os.path.exists(pickle_path):
        print(f"❌ Error: book.pkl not found in '{book_data_folder}'")
        return False

    print(f"📖 Loading book from {pickle_path}...")

    # Load pickle file
    try:
        with open(pickle_path, 'rb') as f:
            book = pickle.load(f)
    except Exception as e:
        print(f"❌ Error loading pickle: {e}")
        return False

    # Convert to JSON-serializable dictionary
    print("🔄 Converting to JSON format...")

    book_json = {
        "metadata": {
            "title": book.metadata.title,
            "language": book.metadata.language,
            "authors": book.metadata.authors,
            "description": book.metadata.description,
            "publisher": book.metadata.publisher,
            "date": book.metadata.date,
            "identifiers": book.metadata.identifiers,
            "subjects": book.metadata.subjects
        },
        "spine": [
            {
                "id": ch.id,
                "href": ch.href,
                "title": ch.title,
                "content": ch.content,
                "text": ch.text,
                "order": ch.order
            }
            for ch in book.spine
        ],
        "toc": convert_toc_recursive(book.toc),
        "images": book.images,
        "source_file": book.source_file,
        "processed_at": book.processed_at,
        "version": book.version
    }

    # Save JSON file
    json_path = os.path.join(book_data_folder, 'book.json')
    print(f"💾 Saving to {json_path}...")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(book_json, f, ensure_ascii=False, indent=2)

    # Print summary
    file_size = os.path.getsize(json_path)
    print(f"\n✅ Conversion successful!")
    print(f"📊 Book: {book.metadata.title}")
    print(f"👤 Authors: {', '.join(book.metadata.authors)}")
    print(f"📄 Chapters: {len(book.spine)}")
    print(f"🖼️  Images: {len(book.images)}")
    print(f"💾 JSON size: {file_size / 1024:.2f} KB")
    print(f"\n📁 Files ready for R2 upload:")
    print(f"   - {json_path}")
    print(f"   - {os.path.join(book_data_folder, 'images/')} (folder)")

    return True


def convert_toc_recursive(toc_list):
    """Recursively convert TOC entries to JSON format."""
    result = []
    for item in toc_list:
        entry = {
            "title": item.title,
            "href": item.href,
            "file_href": item.file_href,
            "anchor": item.anchor,
            "children": convert_toc_recursive(item.children) if item.children else []
        }
        result.append(entry)
    return result


def convert_all_books():
    """Convert all books in the current directory."""
    print("🔍 Searching for book data folders...\n")

    converted = 0
    failed = 0

    # Find all *_data folders
    for item in os.listdir('.'):
        if item.endswith('_data') and os.path.isdir(item):
            print(f"\n{'='*60}")
            print(f"Processing: {item}")
            print('='*60)

            if convert_book_to_json(item):
                converted += 1
            else:
                failed += 1

    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Conversion Summary")
    print('='*60)
    print(f"✅ Converted: {converted}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Total: {converted + failed}")

    if converted > 0:
        print(f"\n🚀 Next steps:")
        print(f"   1. Install Wrangler CLI: npm install -g wrangler")
        print(f"   2. Login to Cloudflare: wrangler login")
        print(f"   3. Create R2 bucket: wrangler r2 bucket create reader3-books")
        print(f"   4. Upload book data (see DEPLOY.md for details)")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Convert specific book
        book_folder = sys.argv[1]
        convert_book_to_json(book_folder)
    else:
        # Convert all books
        convert_all_books()
