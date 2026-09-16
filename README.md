# 🎭 Mimic / 拟态加工

**English** · [中文](#中文) · [Features](#features) · [Install](#install) · [Usage](#usage)

> Imitate × Distort: turn your knowledge notes into shareable narratives, without betraying the knowledge.

Pick knowledge notes, choose a **recipe** (stage + taboos + prompt slots), and an LLM composes an article whose core segment faithfully mirrors the definitions while the narrative shell carries your chosen spin. Output lands as a linked note in your vault.

---

## Features

- **Mimic-distort framework** — a hard fidelity floor (core definitions must survive verbatim or equivalent) plus a bounded distortion layer (no invented facts, recipe taboos respected)
- **Recipes are pure data** — stage (worldview), taboos (forbidden list), and prompt slots; edit everything in the settings GUI, no code changes, plugin stays agnostic to content
- **Three slot types** — select / number / text, each with its own prompt template (`{value}` = user input, `{label}` = display name); compose any structure: stance pairs, personas, tone dials…
- **Two seed recipes** — "产业博弈" (stance-pair structure demo) and "新闻滤镜" (lightweight freeform demo); re-import anytime via command (append-only)
- **Material picker** — fuzzy search (title / chapter / id) with multi-select checkboxes across the whole knowledge base
- **Two-layer draft** — core segment (knowledge-dense, locked) + narrative shell (editable), plus per-note one-liners for the outgoing wiki-links
- **Programmatic gatekeeping** — configurable word-count bounds, then human final edit — no LLM judge by design
- **Bilingual UI** — auto-switches between Chinese and English based on Obsidian's UI language (recipes stay as you wrote them)
- **Command palette** — `Mimic: compose`, `Import seed recipes`

## Install

### Option A: Manual (for developers / early users)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases)
2. Create a folder in your Obsidian vault: `<vault>/.obsidian/plugins/mimic/`
3. Drop the three files in there
4. Obsidian → Settings → Community plugins → turn off **Restricted mode** → enable **Mimic**

> ⚠️ A MiniMax API key is required (domestic endpoint `https://api.minimaxi.com/v1`); fill it in the plugin settings on first run.

### Option B: Prepare a knowledge base (one-time)

The plugin composes from notes with a `kp_id` frontmatter. If you have an existing knowledge base, run the bundled one-shot migration:

```powershell
python migrate/migrate.py --src <knowledge-data-dir> --vault <your-vault>
```

It writes `<vault>/知识点/<chapter>/<kp_id>-<title>.md` notes (definitions and key points as body sections). Re-run after deleting the old `知识点/` folder when the source updates.

## Usage

1. Click the 🎭-style sidebar icon (or run **拟态加工** from the command palette)
2. Search and check the knowledge notes to compose, then **下一步：设置参数**
3. Pick a recipe, fill the slots (stage and taboos show automatically), click **生成** (~0.5–1 min on MiniMax M3)
4. Edit the title, narrative shell, and link one-liners; **写入笔记** saves to `拟态/YYYY-MM-DD-<title>.md`
5. The output note carries a frontmatter snapshot (`recipe` / `params` / `kp_ids`) and a tail of wiki-links back to the source notes

### Recipes at a glance

| Part | Meaning |
|------|---------|
| Stage (worldview) | Fictional stage where the mimicry happens, e.g. "Candy Kingdom vs Gear Kingdom"; empty = real-world register |
| Taboos (forbidden) | Hard boundaries of distortion, e.g. "no fabricated data", joined into the prompt |
| Slots | Wizard controls + prompt fragments; rendered in order into the 【模仿-扭曲参数】 block |

Example slot: label 模仿姿态 (select), template `以{value}的口吻复述知识`, values 老教授 / 科普作家 / 播客主播.

## Contact

- Email: [tp906@163.com](mailto:tp906@163.com)
- Issues: [GitHub Issues](../../issues)

## License

[MIT](./LICENSE) © 2026 tp906

---

# 中文

[English](#mimic--拟态加工) · **中文**

> 拟态 = 模仿 × 扭曲：把知识笔记加工成可传播的叙述，而不背叛知识本身。

选好知识点，挑一份**配方**（舞台 + 禁则 + 提示词槽位），LLM 生成一篇文章——核心段忠实镜像定义，叙事外壳承载你设定的倾向。产物直接落进仓库，连成笔记网络。

## 特性

- **模仿-扭曲框架**：模仿底线（核心定义原样或等价出现）+ 扭曲边界（不编造事实、遵守配方禁则）
- **配方是纯数据**：舞台（worldview）、禁则（forbidden）、提示词槽位全部在设置页 GUI 增删改，插件代码对内容齐次无约束
- **三种槽位**：select / number / text，每个槽位自带 prompt 模板（`{value}` 为用户值，`{label}` 为显示名）；"立场A/B"、"教授口吻"、"强度旋钮"……任何结构都由你组装
- **内置 2 个示范配方**：产业博弈（立场对结构示范）、新闻滤镜（轻量自由示范）；「导入示范配方」命令随时追加（不覆盖）
- **素材选择器**：标题 / 章节 / 编号模糊搜索，复选多选全库知识点
- **两层定稿**：核心段（知识密度最高，只读锁定）+ 叙事外壳（可编辑），外加逐条知识点的一句话关联说明
- **程序化守门**：字数上下限可配 + 人工定稿——设计上不引入 LLM 评估
- **中英双语**：根据 Obsidian 界面语言自动切换（zh / en）；配方内容保持你写的原样
- **命令面板**：`拟态加工：知识点 → 拟态笔记`、`导入示范配方（追加，不覆盖）`

## 安装

### 方式一：手动安装（开发者 / 早期用户）

1. 下载 [最新 Release](../../releases) 中的三个文件：`main.js`、`manifest.json`、`styles.css`
2. 在 Obsidian vault 中创建目录：`<vault>/.obsidian/plugins/mimic/`
3. 把三个文件放入该目录
4. Obsidian → 设置 → 第三方插件 → 关闭「受限模式」→ 启用「Mimic」

> ⚠️ 需要 MiniMax API Key（国内端点 `https://api.minimaxi.com/v1`），首启在插件设置中填入。

### 方式二：准备知识库（一次性）

插件加工的是带 `kp_id` frontmatter 的笔记。已有知识库时用随附的一次性迁移工具：

```powershell
python migrate/migrate.py --src <知识库数据目录> --vault <你的仓库>
```

产出 `<vault>/知识点/<章>/<kp_id>-<标题>.md`（核心定义与关键要点写在正文小节）。上游更新后删除旧 `知识点/` 目录重跑即可。

## 使用

1. 点击侧边栏图标（或命令面板执行「拟态加工：知识点 → 拟态笔记」）
2. 搜索并勾选要加工的知识点 →「下一步：设置参数」
3. 选配方、填槽位（舞台与禁则自动展示）→「生成」（MiniMax M3 约 0.5~1 分钟）
4. 编辑标题、叙事外壳与关联说明 →「写入笔记」，落盘为 `拟态/YYYY-MM-DD-<标题>.md`
5. 产物 frontmatter 记录 `recipe` / `params` / `kp_ids` 快照，文尾 wiki-link 回链知识点

## 配方速览

| 组成 | 含义 |
|------|------|
| 舞台（worldview） | 模仿发生的虚构舞台，如"糖果国 vs 齿轮国"；留空即现实语境 |
| 禁则（forbidden） | 扭曲的硬边界（"不编造数据"…），拼接进 prompt |
| 槽位（slots） | 向导控件 + prompt 片段，按顺序拼进【模仿-扭曲参数】区 |

槽位示例：显示名「模仿姿态」（select），模板 `以{value}的口吻复述知识`，可选：老教授 / 科普作家 / 播客主播。

## 联系作者

- 邮箱：[tp906@163.com](mailto:tp906@163.com)
- 问题反馈：[GitHub Issues](../../issues)

## 许可证

[MIT](./LICENSE) © 2026 tp906
