# 🎭 Mimic / 拟态加工

**English** · [中文](#中文)

Media select, process, and recombine information before presenting it to you — that filtered environment is what Lippmann called the *pseudo-environment*, much like a beauty filter on a livestream.

This plugin lets you set up templates in that spirit — news broadcast, talk-show interview, campaign debate, classic-story retelling — and runs your notes through LLM-powered mimicry, deepening your memory of the original material. How to use: right-click a note in the left sidebar (or multi-select a few in the file list), pick a **recipe** (a stage, a few taboos, a handful of prompt slots), and an LLM writes a piece — the core segment mirrors the definitions faithfully and stays locked, the narrative shell bends to your taste and stays editable, and the result is written into the vault with links back to the source notes. You can also click the ❝ icon in the left ribbon to compose the note you are currently editing.

## Features

- Recipes are pure data: stage, taboos and slots are edited in the settings GUI, never in code
- Three slot types (dropdown / number / free text), each with a one-line template like `explain in the voice of {value}` — compose any structure you like
- Three seed recipes ship in the box: 产业博弈 (a stance duel), 西游新传 (Journey to the West), News Desk (English)
- Two-layer drafts: the core segment stays locked, the shell is yours to edit, and the tail links every source note
- UI follows Obsidian's language (zh/en); output follows the material's language

## Install

### Option A: Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases)
2. Create `<vault>/.obsidian/plugins/mimic/` and drop the three files in
3. Obsidian → Settings → Community plugins → enable **Mimic**, then paste an API key in the plugin settings — any OpenAI-compatible endpoint works (DeepSeek / Kimi / Ollama / LM Studio…); the built-in defaults are a MiniMax example

### Option B: Community plugin marketplace (once approved)

Obsidian → Settings → Community plugins → Browse → search **Mimic** → Install

## Preparing material

Two ways to feed the composer:

**A. Run the one-shot migration** if your knowledge base is a SQLite file (`migrate/migrate.py --src <dir-with-knowledge.db> --vault <vault>`). It expects a `knowledge_points` table:

| Column | Type | Meaning |
|---|---|---|
| `id` | int | unique note id, becomes `kp_id` and the file name prefix |
| `title` | text | note title |
| `chapter_no` / `chapter_title` | text/int | chapter folder |
| `section` | text | section label |
| `core_definition` | text | the definition; written as a `## 核心定义` body section |
| `key_points` | text (JSON array) | bullets under `## 关键要点` |
| `related_ids` | text (JSON array) | ids to link; emitted as wiki-links |
| `equivalent_expressions` | text (JSON array) | rewordings, optional |
| `exam_level`, `knowledge_type`, `source_id` | — | metadata carried into frontmatter |

**B. Skip the script entirely.** Notes with a `kp_id` frontmatter are treated as knowledge notes (used for the file-name wiki-links and the `kp_ids` record); hand-write them if you like. Everything else composes fine too — the plugin takes whatever files you select, no folder or frontmatter required.

## Usage

1. Right-click any note → **Mimic: compose this note**; or multi-select notes in the file browser → **Mimic: compose N selected notes**; or click the sidebar icon / command to compose the note you are editing
2. Pick a recipe, fill the slots, hit **Compose** (duration depends on the model; ~0.5–1 min on the default M3)
3. Edit the title, the shell and the link blurbs; **Write note** saves to `拟态/YYYY-MM-DD-<title>.md`
4. The output carries a `recipe` / `params` / `kp_ids` snapshot and wiki-links back to every source

## Contact

- Email: [tp906@163.com](mailto:tp906@163.com)
- Issues: [GitHub Issues](../../issues)

## License

[MIT](./LICENSE) © 2026 tp906

---

# 中文

[English](#mimic--拟态加工) · **中文**

媒体对信息进行选择、加工和重组，再呈现给你——这个被"加工过"的环境就是拟态环境，就像直播间的美颜滤镜。

这个插件可以设定新闻、访谈、辩论、经典故事等一系列模板，通过 LLM，对你的笔记进行拟态加工，加深你对原笔记知识点的记忆。操作方法：Obsidian 左边栏中右键点击一篇笔记（或在文件列表里多选几篇），选一个**配方**（一个舞台、几条禁则、几个提示词槽位），LLM 写出一篇文章——核心段忠实镜像定义且锁定，叙事外壳随你口味变形、可编辑，产物写入仓库，并反向关联原素材。点击左侧栏的 ❝ 图标，也可以对当前打开的笔记进行加工。

## 特性

- 配方即数据：舞台、禁则、槽位全在设置页增删改，不用碰代码
- 三种槽位（下拉 / 数字 / 自由文本），每个槽位一句话模板，如 `以{value}的口吻复述知识`——任意结构随你组装
- 内置三个示范配方：产业博弈（双立场对垒）、西游新传（取经路上讲知识）、News Desk（英文）
- 产物分两层：核心段锁定、外壳可编辑，文尾自动回链每篇素材
- 界面随 Obsidian 语言（中/英）；产物语言随素材语言

## 安装

### 方式一：手动安装

1. 从 [最新 Release](../../releases) 下载三个文件：`main.js`、`manifest.json`、`styles.css`
2. 建目录 `<vault>/.obsidian/plugins/mimic/`，三个文件放进去
3. Obsidian → 设置 → 第三方插件 → 启用 **Mimic**，再到插件设置里填 API Key——任意 OpenAI 兼容端点都行（DeepSeek / Kimi / Ollama / LM Studio…），内置默认值是 MiniMax 的示例

### 方式二：社区插件市场（提交审核通过后）

Obsidian → 设置 → 第三方插件 → 浏览 → 搜 **Mimic** → 安装

## 准备素材

喂给插件的路子有两条：

**A. 跑一次性迁移**——已有结构化知识库（SQLite）时用 `migrate/migrate.py --src <含knowledge.db的目录> --vault <仓库>`。脚本要求库里有一张 `knowledge_points` 表：

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | int | 知识点编号（唯一），成为 `kp_id` 与文件名前缀 |
| `title` | text | 标题 |
| `chapter_no` / `chapter_title` | text/int | 章目录 |
| `section` | text | 节名 |
| `core_definition` | text | 核心定义，写进正文 `## 核心定义` 小节 |
| `key_points` | text（JSON 数组） | `## 关键要点` 下的条目 |
| `related_ids` | text（JSON 数组） | 关联知识点 id，生成 wiki-link |
| `equivalent_expressions` | text（JSON 数组） | 等价表述，可空 |
| `exam_level`、`knowledge_type`、`source_id` | — | 元数据，进 frontmatter |

**B. 不跑脚本也行。** 带 `kp_id` frontmatter 的笔记被视为知识点（用于文件名 wiki-link 与产物 `kp_ids` 记录），手写也可以；其余任何笔记照常加工——插件拿你选中的文件当素材，不看目录、不限 frontmatter。

## 使用

1. 右键任意笔记 →「拟态加工：加工此笔记」；或在文件列表多选几篇 →「对选中的 N 个文件加工」；也可以点侧边栏图标 / 命令面板，加工正在编辑的这篇
2. 选配方、填槽位、点**生成**（时长视模型而定，默认 M3 约 0.5~1 分钟）
3. 改标题、改外壳、改关联说明，**写入笔记**，落盘为 `拟态/YYYY-MM-DD-<标题>.md`
4. 产物 frontmatter 记录 `recipe` / `params` / `kp_ids` 快照，文尾 wiki-link 回链每篇素材

## 联系作者

- 邮箱：[tp906@163.com](mailto:tp906@163.com)
- 问题反馈：[GitHub Issues](../../issues)

## 许可证

[MIT](./LICENSE) © 2026 tp906
