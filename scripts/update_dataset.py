#!/usr/bin/env python3
"""Rebuild data/datasets.json from a Data Primer CSV.

Existing thumbnail assignments are preserved by normalized dataset name or URL.
Every CSV row is preserved, including the underlying Contributor field.
"""

import argparse
import csv
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "datasets.json"


def clean(value):
    return re.sub(r"\s+", " ", str(value or "").strip())


def normalized_name(value):
    return re.sub(r"[^a-z0-9]+", "", clean(value).casefold())


def first_url(value):
    match = re.search(r"https?://[^\s]+", clean(value), re.I)
    return match.group(0).rstrip(".,;)") if match else ""


def normalized_url(value):
    url = first_url(value)
    if not url:
        return ""
    parts = urlsplit(url)
    return urlunsplit(
        (parts.scheme.casefold(), parts.netloc.casefold(), parts.path.rstrip("/"), parts.query, "")
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file", type=Path, help="Path to the updated Data Primer CSV")
    args = parser.parse_args()
    source = args.csv_file.resolve()

    rows = list(csv.DictReader(source.read_text(encoding="cp1252").splitlines()))
    old = json.loads(OUT.read_text(encoding="utf-8"))
    by_name, by_url = {}, {}
    for item in old:
        thumb = item.get("thumbnail", "")
        if not thumb or "placeholder-" in thumb:
            continue
        by_name.setdefault(normalized_name(item.get("name")), thumb)
        for field in ("interactiveUrl", "moreInfoUrl"):
            url = normalized_url(item.get(field))
            if url:
                by_url.setdefault(url, thumb)

    records, next_id = [], 1
    for row in rows:
        name = clean(row.get("Dataset Name"))
        description = clean(row.get("Description"))
        category = clean(row.get("Categories"))
        url = clean(row.get("Interactive Graphic Link")) or clean(row.get("More Info Link"))
        supplied = clean(row.get("Number"))
        record_id = int(supplied) if supplied.isdigit() else next_id
        next_id = max(next_id, record_id + 1)
        item = {
            "id": record_id,
            "category": category,
            "name": name,
            "description": description,
            "source": clean(row.get("Source")),
            "timeframe": clean(row.get("Timeframe")),
            "format": clean(row.get("Format")),
            "moreInfoLabel": clean(row.get("More Information")),
            "moreInfoUrl": clean(row.get("More Info Link")),
            "interactiveUrl": clean(row.get("Interactive Graphic Link")),
            "contributor": clean(row.get("Contributor")),
        }
        thumb = by_name.get(normalized_name(name))
        if not thumb:
            thumb = next(
                (
                    by_url[normalized_url(item[field])]
                    for field in ("interactiveUrl", "moreInfoUrl")
                    if normalized_url(item[field]) in by_url
                ),
                "",
            )
        theme = category.casefold()
        fallback = theme if theme in {"climate", "economic", "environment", "social"} else "environment"
        item["thumbnail"] = thumb or f"thumbnails/placeholder-{fallback}.svg"
        records.append(item)

    if len({item["id"] for item in records}) != len(records):
        raise ValueError("Dataset IDs must be unique")

    data_dir = ROOT / "data"
    data_dir.mkdir(exist_ok=True)
    shutil.copyfile(source, data_dir / source.name)
    OUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} datasets to {OUT}")


if __name__ == "__main__":
    main()
