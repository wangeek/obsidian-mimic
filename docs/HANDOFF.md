# HANDOFF — 接手 agent 必读（自包含，不依赖任何外部项目上下文）

本文件是 Fake News 插件的交接记忆。以下是维护此项目必需、且无法从代码
快速推断的事实与教训。

## 1. MiniMax 平台事实

- 用户的 API key 属**国内平台**：`https://api.minimaxi.com/v1` 可用；
  国际站 `api.minimax.io` 对同 key 返回 401。OpenAI 兼容 `/chat/completions`。
- **M3 与 M2.x 全系是推理模型**：回复 content 带 `<think>…</think>` 前缀，
  必须剥离（`src/llm.ts` 的 `stripThink`）——不剥会污染正文且 JSON 解析
  错位。M3 生成约 0.5~1 分钟/篇。
- LLM 偶发 5xx：`chat()` 已内置 2 次重试（指数退避）。

## 2. prompt 结构（随代码自描述）

四层注入：世界观 → 拟态矛盾（立场 A/B）→ 加工参数 → 知识素材。
输出严格 JSON `{title, core_segment, narrative_shell}`；宽松解析
（`parseJsonLoose`）容忍代码栅栏与前后杂文。见 `src/prompt.ts` 内联全文。

## 3. 知识库契约与迁移语义

- 知识点笔记 frontmatter 契约见 `migrate/README.md`；`kp_id` 全库唯一，
  是 wiki-link 命名（`<kp_id>-<标题>.md`）与产物 `kp_ids` 的关联键。
- 插件运行时**只读 vault 笔记**（`src/main.ts` 的 `indexKnowledge` 扫描
  frontmatter），无 sqlite 依赖。
- 迁移工具是一次性快照拷贝：知识库更新需删 `知识点/` 重跑 migrate。

## 4. 配置体系（平台化原则）

- 矛盾组与参数维度都是**数据**：设置页 GUI CRUD（`src/settings.ts`），
  存 Obsidian 插件 `data.json`。维度 schema（`ParamDim`）驱动向导动态
  渲染——新增自定义维度只改配置不改代码，产物 frontmatter 自动携带。
- 插件代码对内容保持齐次无约束；prompt 收到的是数据。

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
  main.js/manifest.json/styles.css 到 `<vault>/.obsidian/plugins/fake-news/`。
- 本工程结构与脚本风格沿用作者此前的 obsidian-lottery 模板。

## 7. 已知边界

- 生成质量守门 = 程序化校验（字数上下限 + 人工定稿），无 LLM 评估环节
  ——这是设计决策，不是缺失。
- 素材搜索列表上限 200 条显示（全库 377 点时按搜索过滤）。
- 产物文件名冲突自动加 `-2` 后缀。
