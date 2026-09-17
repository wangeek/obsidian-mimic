# HANDOFF — 接手 agent 必读（自包含，不依赖任何外部项目上下文）

本文件是 Mimic 插件的交接记忆。以下是维护此项目必需、且无法从代码
快速推断的事实与教训。

## 1. MiniMax 平台事实

- 插件走标准 OpenAI 兼容 `/chat/completions`，**不限 MiniMax**（DeepSeek /
  Kimi / Ollama / LM Studio 等均可）；MiniMax 仅是出厂默认值。以下为默认
  端点的实测经验。
- 用户的 API key 属**国内平台**：`https://api.minimaxi.com/v1` 可用；
  国际站 `api.minimax.io` 对同 key 返回 401。
- **M3 与 M2.x 全系是推理模型**：回复 content 带 `<think>…</think>` 前缀，
  必须剥离（`src/llm.ts` 的 `stripThink`）——不剥会污染正文且 JSON 解析
  错位。M3 生成约 0.5~1 分钟/篇。
- LLM 偶发 5xx：`chat()` 已内置 2 次重试（指数退避）。

## 2. prompt 结构（随代码自描述）

i18n：`src/i18n.ts` 仿 lottery 模式——EN 为基准字典 + `TranslationKey` 编译期
保证 ZH 键同步；`window.moment.locale()` 探测（zh* → zh）；仅 UI chrome 双语，
**prompt 装配与配方内容保持中文**（内容数据，不随界面语言切换）。

模仿-扭曲框架：模仿底线（核心定义原样或等价出现）+ 扭曲边界（不编造、
遵禁则）。【模仿-扭曲参数】区由配方槽位渲染——每个槽位自带 prompt 模板
（`{value}`/`{label}` 占位）。输出严格 JSON
`{title, core_segment, narrative_shell, link_notes}`；宽松解析
（`parseJsonLoose`）容忍代码栅栏与前后杂文。link_notes（键=知识点标题，
值=一句话说明）写进产物文尾关联链接，LLM 缺省时回退章节注、定稿页可编辑。
见 `src/prompt.ts`。

## 3. 知识库契约与迁移语义

- 知识点笔记 frontmatter 契约见 `migrate/README.md`；`kp_id` 全库唯一，
  是 wiki-link 命名（`<kp_id>-<标题>.md`）与产物 `kp_ids` 的关联键。
- **核心定义/关键要点写在笔记正文小节**（`## 核心定义` / `## 关键要点`），
  不在 frontmatter——插件 prompt 素材按正文小节提取
  （`main.ts` 的 `readKpSections`），frontmatter 只供索引（kp_id/标题/章节）。
- 插件运行时**只读 vault 笔记**（`src/main.ts` 的 `indexKnowledge` 扫描
  frontmatter），无 sqlite 依赖。
- 迁移工具是一次性快照拷贝：知识库更新需删 `知识点/` 重跑 migrate。

## 4. 配置体系（平台化原则）

- **拟态配方（Recipe）= 舞台 + 禁则 + 提示词槽位（slots）**，全部是数据：
  设置页 GUI CRUD（`src/settings.ts`），存 Obsidian 插件 `data.json`。
- 槽位三种控件（select/number/text），每个槽位自带 prompt 模板——
  "立场A/B"等一切结构都是用户用槽位组装的，插件代码对内容齐次无约束。
- 内置 3 个示范配方（`src/types.ts` SEED_RECIPES）：产业博弈（双立场结构）
  + **西游新传**（取经路上讲知识，形象化示范；替换了早期的"新闻滤镜"）
  + **News Desk**（英文轻量示范：播报/访谈/辩论）。面向用户的槽位命名走
  通俗路线（"偏向哪边/发挥程度"），不用"扭曲向量"类术语；设置页指南解释
  prompt 注入机制（插件只拼装指令，不懂内容）。
- **产物语言跟随素材**：GENERATE_SYSTEM 硬规则要求输出语言 = 知识素材语言
  （标题/正文/link_notes 一致），防止因中文 prompt 导致英文素材产出中文。
- 素材入口（2026-09-17 重构，目录勾选式选择器已移除）：①ribbon/命令 =
  加工当前笔记；②文件浏览器右键 = 加工此笔记 / 对选中的 N 个文件加工
  （多选集合读 file-explorer 的 `selectedDoms`——**非公开 API**，try-catch
  降级为右键锚点文件）。无 kp_id 的笔记标 `external`，不进产物 `kp_ids`，
  回链用文件名 wiki-link。默认字数守门 300~800（prompt 同步注入预算）。

## 5. 环境事实（Windows / 本机）

- PowerShell 5.1：中文 body 必须显式 UTF-8 bytes；`.ps1` 一律 ASCII-only；
  哈希表键大小写不敏感（'R'/'r' 冲突）。
- 本机命令偶发**双发**（同命令执行两次）：写文件用追加或幂等设计。
- 长驻服务用 `Start-Process` 分离进程（会话后台任务会被回收）。

## 6. Obsidian 插件开发事实

- API 真源 = 官方 sample-plugin 仓库与 obsidian.d.guide，**不凭记忆写 API**。
- `requestUrl`（obsidian 模块）绕 CORS，是外部 HTTP 的标准路径。
- 配置存储 = `loadData()/saveData()`（插件目录 `data.json`）。
- 构建：`npm run build`（esbuild → main.js）；安装 = 拷贝
  main.js/manifest.json/styles.css 到 `<vault>/.obsidian/plugins/mimic/`。
- 本工程结构与脚本风格沿用作者此前的 obsidian-lottery 模板。
- **当前验证/使用环境**：vault = `D:\notes\2025`（插件已装并启用，知识库
  已迁入 `知识点/` 377 篇，API Key 已由用户配置在插件 data.json）。

## 7. 已知边界

- 生成质量守门 = 程序化校验（字数上下限 + 人工定稿），无 LLM 评估环节
  ——这是设计决策，不是缺失。
- 素材搜索列表上限 200 条显示（全库 377 点时按搜索过滤）。
- 产物文件名冲突自动加 `-2` 后缀。
