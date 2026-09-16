# migrate — 一次性迁移工具（跑完即弃）

把既有知识库导出为 Obsidian 仓库的知识点笔记，并产出矛盾组种子。

## 用法

```powershell
python migrate.py --src <知识库数据目录> --vault <Obsidian仓库根目录>
```

- `<知识库数据目录>`：包含 `knowledge.db` 与 `conflicts/*.json` 的目录。
- `<vault>`：你的 Obsidian 仓库根（将创建 `知识点/` 目录）。
- 种子输出到本仓库 `assets/seed/conflicts.json`。

## 知识点笔记契约（插件读取的 frontmatter）

```yaml
kp_id: 199
title: 服务目录管理
chapter: '3'
chapter_title: IT服务管理
section: 3.2 服务目录
source: 新版教程
knowledge_type: 概念类
exam_level: 2
related: [205, 210]
```

## 一次性语义

- 只做**快照拷贝**，不回写知识库来源。
- 知识库更新后需删除 vault 的 `知识点/` 目录重跑本工具。
- 本工具本身不再维护（迁移完成即退役）。
