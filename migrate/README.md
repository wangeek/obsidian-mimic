# migrate — 一次性迁移工具（跑完即弃）

把既有知识库（sqlite）导出为 Obsidian 仓库的知识点笔记。

## 用法

```powershell
python migrate.py --src <知识库数据目录> --vault <Obsidian仓库根目录>
```

- `<知识库数据目录>`：包含 `knowledge.db` 的目录。
- `<vault>`：你的 Obsidian 仓库根（将创建 `知识点/` 目录）。

## knowledge.db schema（脚本依赖的输入契约）

sqlite 文件，表 `knowledge_points`，脚本读取以下字段：

| 字段 | 类型 | 必填 | 用途 |
|---|---|---|---|
| id | INTEGER（主键） | ✓ | 知识点编号 → 文件名 `<id>-<标题>.md` 与 wiki-link |
| title | TEXT | ✓ | 笔记标题 |
| core_definition | TEXT | ✓ | 正文「核心定义」小节 |
| key_points | TEXT，JSON 字符串数组 | | 正文「关键要点」小节（缺省 `[]`） |
| chapter_no | TEXT | ✓ | 章节目录名 `<chapter_no>-<chapter_title>/` |
| chapter_title | TEXT | | 同上；章节元信息 |
| section | TEXT | | frontmatter `section` |
| related_ids | TEXT，JSON 数组（id 列表） | | 「相关知识点」小节互链；两遍扫描保证链接可解析 |
| equivalent_expressions | TEXT，JSON 数组 | | 正文「等价表述」小节 |
| knowledge_type | TEXT | | frontmatter 元信息 |
| exam_level | INTEGER | | frontmatter 元信息 |
| source_id | TEXT | | frontmatter `source` |

注：表中若还有其他字段（如 source_block_ids / source_page）会被忽略，不影响运行。

## 知识点笔记契约（插件读取的 frontmatter 与正文小节）

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

正文小节：`# 标题` → `## 核心定义` → `## 关键要点` → `## 等价表述` → `## 相关知识点`。
插件 prompt 素材按正文小节提取（核心定义/关键要点），frontmatter 只供索引。

## 一次性语义

- 只做**快照拷贝**，不回写知识库来源。
- 知识库更新后需删除 vault 的 `知识点/` 目录重跑本工具。
- 正文"相关知识点"小节输出完整 wiki-link `[[<id>-<标题>|<标题>]]`（两遍扫描
  以 id→标题映射保证链接与文件名一致；引用了未导入 id 时降级为纯文本并告警）。
- 本工具本身不再维护（迁移完成即退役）。
