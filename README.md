# 🎭 Mimic / 拟态加工

**English** · [中文](#中文)

> Mimicry works like the Monkey King's seventy-two transformations: the shape may change freely, the body must not. Mimic hands your knowledge notes to an LLM and lets it "transform" them into an article worth reading — the telling is yours to configure, the core definitions must survive word-for-word.

Configure a **recipe** (which world to tell it in, what is forbidden, which lines to write by), pick the source notes, hit compose. The output lands in your vault as a note that links back to the sources.

## Features

- Recipes are plain data — stage, taboos and prompt slots, all edited in the settings GUI, no code
- Each slot is one line sent to the AI (dropdown / number / text controls with a sentence template each) — any structure is yours to assemble
- Three seed recipes to learn from: 产业博弈 (two stances), 西游新传 (teaching on the pilgrimage road), News Desk (English)
- Output is a note network: frontmatter snapshots the recipe, tail wiki-links point back to the source notes; any open note can serve as material, not just the knowledge folder
- Bilingual UI (zh/en); output language follows the material; word-count bounds are configurable

## Install

### Option A: Manual

1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](../../releases)
2. Put them in `<vault>/.obsidian/plugins/mimic/`
3. Obsidian → Settings → Community plugins → enable **Mimic**
4. Fill in a MiniMax API key in the plugin settings (endpoint `https://api.minimaxi.com/v1`)

### Option B: Community plugin marketplace (once approved)

Settings → Community plugins → Browse → search **Mimic** → Install

## Preparing a knowledge base (optional, one-time)

Mimic composes notes that carry a `kp_id` frontmatter. If your knowledge lives elsewhere, convert it with the bundled migrate script:

```powershell
python migrate/migrate.py --src <dir containing knowledge.db> --vault <your vault>
```

It expects a sqlite file `knowledge.db` with a `knowledge_points` table containing at least:

| Column | Type | Used for |
|---|---|---|
| id | INTEGER | note id → filename and wiki-links |
| title | TEXT | note title |
| core_definition | TEXT | goes into the `## 核心定义` body section |
| key_points | TEXT (JSON array) | bullet list section |
| chapter_no / chapter_title / section | TEXT | chapter folder naming and metadata |
| related_ids | TEXT (JSON array of ids) | cross-links between notes |
| equivalent_expressions | TEXT (JSON array) | extra body section |
| knowledge_type / exam_level / source_id | TEXT / INTEGER | frontmatter metadata |

Output: `知识点/<chapter>/<id>-<title>.md`. To refresh after the source changes, delete the old `知识点/` folder and re-run.

## Usage

1. Click the ❝ sidebar icon (or run **Mimic: compose** from the command palette)
2. Pick material — search the knowledge folder, or just use the note you are editing
3. Choose a recipe, adjust slot values, compose (MiniMax M3 takes ~0.5–1 min)
4. On the review page fix the title, edit the shell, fill link blurbs, then write the note

## Contact

- Email: [tp906@163.com](mailto:tp906@163.com)
- Issues: [GitHub Issues](../../issues)

## License

[MIT](./LICENSE) © 2026 tp906

---

# 中文

[English](#mimic--拟态加工) · **中文**

> 拟态这回事，可以拿孙悟空的七十二变来理解：怎么变都行，本体不能丢。
> Mimic 做的就是这件事——把知识笔记交给大模型"变"成一篇读得下去的文章：
> 讲法随你配，核心定义一个字不许错。

配一张**配方**（在哪个世界讲、什么不许干、按哪几句话写），选好素材，
点生成，产物落进仓库并回链知识点。适合把复习资料变成愿意读的东西。

## 特性

- 配方是纯数据：舞台、禁则、提示词槽位，全在设置页增删改，不用碰代码
- 槽位就是发给 AI 的一句指令（下拉/数字/文本三种控件，各带一句话模板），任何结构自己拼
- 自带三个示范配方可参考：产业博弈（双立场）、西游新传（取经路上讲知识）、News Desk（英文）
- 产物是笔记网络：frontmatter 记录配方快照，文尾 wiki-link 回链素材；正在编辑的任意笔记也能直接当素材
- 中英双语界面；产物语言跟随素材；字数上下限可配

## 安装

### 方式一：手动安装

1. 下载 [最新 Release](../../releases) 的 `main.js`、`manifest.json`、`styles.css`
2. 放进 `<vault>/.obsidian/plugins/mimic/`
3. Obsidian → 设置 → 第三方插件 → 启用 **Mimic**
4. 在插件设置里填 MiniMax API Key（国内端点 `https://api.minimaxi.com/v1`）

### 方式二：社区插件市场（审核通过后）

设置 → 第三方插件 → 浏览 → 搜 **Mimic** → 安装

## 准备知识库（可选，一次性）

Mimic 加工的是带 `kp_id` frontmatter 的笔记。知识库在别处的话，用仓库自带的
migrate 脚本转成笔记：

```powershell
python migrate/migrate.py --src <含 knowledge.db 的目录> --vault <你的仓库>
```

脚本要求一个 sqlite 文件 `knowledge.db`，内含 `knowledge_points` 表，至少要有这些字段：

| 字段 | 类型 | 用途 |
|---|---|---|
| id | INTEGER | 知识点编号（主键）→ 文件名与 wiki-link |
| title | TEXT | 标题 |
| core_definition | TEXT | 写进正文「核心定义」小节 |
| key_points | TEXT（JSON 数组） | 「关键要点」小节 |
| chapter_no / chapter_title / section | TEXT | 章节目录命名与元信息 |
| related_ids | TEXT（JSON 数组，id 列表） | 笔记间互链 |
| equivalent_expressions | TEXT（JSON 数组） | 「等价表述」小节 |
| knowledge_type / exam_level / source_id | TEXT / INTEGER | frontmatter 元信息 |

跑完后 `知识点/<章>/<id>-<标题>.md` 各就各位。上游数据更新时，删掉旧 `知识点/` 目录重跑即可。

## 使用

1. 点侧边栏 ❝ 图标（或命令面板运行「拟态加工」）
2. 选素材——从知识点目录搜，或直接用当前打开的笔记
3. 选配方、按需改槽位值，点生成（MiniMax M3 约半分钟到一分钟）
4. 定稿页改标题、编辑外壳、补关联说明，写入笔记

## 联系作者

- 邮箱：[tp906@163.com](mailto:tp906@163.com)
- 问题反馈：[GitHub Issues](../../issues)

## 许可证

[MIT](./LICENSE) © 2026 tp906
