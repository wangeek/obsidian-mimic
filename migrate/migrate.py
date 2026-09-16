# -*- coding: utf-8 -*-
"""Fake News 一次性迁移工具（跑完即弃，不再维护）。

把知识库 sqlite（377 知识点）导出为 Obsidian 仓库的知识点笔记，
并把矛盾组 JSON 汇总为本插件仓库的种子文件。

用法（PowerShell）：
  python migrate.py --src D:/Lab/MindEcho/data --vault "D:/path/to/your/vault"

产物：
  1) <vault>/知识点/<章>-<章标题>/<kp_id>-<标题>.md   （frontmatter 契约见 README）
  2) 本仓库 assets/seed/conflicts.json                 （种子，首启后在插件设置中演化）

一次性语义：sqlite 为快照拷贝，不回写任何上游；知识库更新后需重跑本工具。
"""
import argparse
import json
import re
import sqlite3
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent


def safe_name(s: str, limit: int = 60) -> str:
    s = re.sub(r'[\\/:*?"<>|#^\[\]]', "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:limit]


def load_j(s, fallback):
    try:
        return json.loads(s) if s else fallback
    except Exception:
        return fallback


def migrate(src_dir: Path, vault: Path) -> None:
    kdb = src_dir / "knowledge.db"
    if not kdb.exists():
        raise SystemExit(f"knowledge.db not found: {kdb}")

    conn = sqlite3.connect(str(kdb))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, source_id, chapter_no, chapter_title, section, title,"
        " core_definition, key_points, exam_level, related_ids,"
        " equivalent_expressions, knowledge_type FROM knowledge_points ORDER BY id"
    ).fetchall()
    total = len(rows)
    print(f"knowledge points: {total}")

    kp_root = vault / "知识点"
    if kp_root.exists():
        raise SystemExit(f"target exists: {kp_root}（请先删除旧目录再迁移）")
    kp_root.mkdir(parents=True)

    written = 0
    for r in rows:
        chapter_dir = kp_root / f"{r['chapter_no']}-{safe_name(r['chapter_title'] or '未命名章', 40)}"
        if not chapter_dir.exists():
            chapter_dir.mkdir(parents=True)
        key_points = load_j(r["key_points"], [])
        related = load_j(r["related_ids"], [])
        equiv = load_j(r["equivalent_expressions"], [])

        fm = [
            "---",
            f"kp_id: {r['id']}",
            f"title: {json.dumps(r['title'], ensure_ascii=False)}",
            f"chapter: '{r['chapter_no']}'",
            f"chapter_title: {json.dumps(r['chapter_title'] or '', ensure_ascii=False)}",
            f"section: {json.dumps(r['section'] or '', ensure_ascii=False)}",
            f"source: {json.dumps(r['source_id'], ensure_ascii=False)}",
            f"knowledge_type: {json.dumps(r['knowledge_type'], ensure_ascii=False)}",
            f"exam_level: {r['exam_level']}",
            f"related: [{', '.join(str(x) for x in related)}]",
            "---",
            "",
        ]
        body = [f"# {r['title']}", ""]
        body.append("## 核心定义")
        body.append("")
        body.append(r["core_definition"])
        body.append("")
        if key_points:
            body.append("## 关键要点")
            body.append("")
            for kp in key_points:
                body.append(f"- {kp}")
            body.append("")
        if equiv:
            body.append("## 等价表述")
            body.append("")
            for e in equiv:
                body.append(f"- {e}")
            body.append("")
        if related:
            body.append("## 相关知识点")
            body.append("")
            for rid in related:
                body.append(f"- [[{rid}-]]")
            body.append("")

        out = chapter_dir / f"{r['id']}-{safe_name(r['title'])}.md"
        out.write_text("\n".join(fm + body), encoding="utf-8")
        written += 1

    print(f"written: {written} notes under {kp_root}")
    if written != total:
        raise SystemExit(f"count mismatch: db={total} written={written}")

    # 矛盾组种子：conflicts/*.json 合并为数组
    conflicts_dir = src_dir / "conflicts"
    seed_path = REPO / "assets" / "seed" / "conflicts.json"
    groups = []
    if conflicts_dir.is_dir():
        for f in sorted(conflicts_dir.glob("*.json")):
            try:
                groups.append(json.loads(f.read_text(encoding="utf-8")))
            except Exception as e:
                print(f"skip bad conflict json: {f.name}: {e}")
    seed_path.parent.mkdir(parents=True, exist_ok=True)
    seed_path.write_text(json.dumps(groups, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"conflict seed: {len(groups)} groups -> {seed_path}")
    print("done. 下一步：在 Obsidian 中安装插件 → 命令面板运行「导入种子配置」→ 设置中确认矛盾组。")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="知识库数据目录（含 knowledge.db 与 conflicts/）")
    ap.add_argument("--vault", required=True, help="Obsidian 仓库根目录")
    a = ap.parse_args()
    migrate(Path(a.src), Path(a.vault))


if __name__ == "__main__":
    main()
