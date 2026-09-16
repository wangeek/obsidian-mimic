# -*- coding: utf-8 -*-
"""Mimic 一次性迁移工具（跑完即弃，不再维护）。

把知识库 sqlite（377 知识点）导出为 Obsidian 仓库的知识点笔记。
（拟态配方为插件内置示范 + 设置页 GUI 维护，无需迁移。）

用法（PowerShell）：
  python migrate.py --src D:/path/to/knowledge-data --vault "D:/path/to/your/vault"

产物：
  <vault>/知识点/<章>-<章标题>/<kp_id>-<标题>.md   （frontmatter 契约见 README）

一次性语义：sqlite 为快照拷贝，不回写任何上游；知识库更新后需重跑本工具。
"""
import argparse
import json
import re
import sqlite3
from pathlib import Path


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

    # 第一遍：id -> 安全标题映射（wiki-link 目标必须与文件名完全一致）
    id2title = {r["id"]: safe_name(r["title"]) for r in rows}

    kp_root = vault / "知识点"
    if kp_root.exists():
        raise SystemExit(f"target exists: {kp_root}（请先删除旧目录再迁移）")
    kp_root.mkdir(parents=True)

    written = 0
    missing_related = []  # (本条id, 引用但未导入的id)
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
                t = id2title.get(rid)
                if t:
                    body.append(f"- [[{rid}-{t}|{t}]]")
                else:
                    missing_related.append((r["id"], rid))
                    body.append(f"- {rid}（未导入）")
            body.append("")

        out = chapter_dir / f"{r['id']}-{safe_name(r['title'])}.md"
        out.write_text("\n".join(fm + body), encoding="utf-8")
        written += 1

    print(f"written: {written} notes under {kp_root}")
    if written != total:
        raise SystemExit(f"count mismatch: db={total} written={written}")
    if missing_related:
        print(f"warning: {len(missing_related)} related refs not importable:")
        for a, b in missing_related[:20]:
            print(f"  kp {a} -> {b}")
    print("done. 下一步：在 Obsidian 中安装插件 → 命令面板「导入示范配方」→ 设置中填 API Key 并按需改造配方。")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="知识库数据目录（含 knowledge.db 与 conflicts/）")
    ap.add_argument("--vault", required=True, help="Obsidian 仓库根目录")
    a = ap.parse_args()
    migrate(Path(a.src), Path(a.vault))


if __name__ == "__main__":
    main()
