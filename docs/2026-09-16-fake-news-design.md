# Fake News — 知识点拟态加工 Obsidian 插件 · 设计文档

日期：2026-09-16 ｜ 状态：设计定稿（用户已确认）
来源：从 MindEcho（D:\Lab\MindEcho）抽取 LLM 加工能力的一次性迁移任务。
移交后 MindEcho 不再维护加工功能的新需求（其 llm.rs 原地保留供游戏用，
两处独立演化）。

---

## 1. 定位

把已有知识库（软考"系统规划与管理师"377 知识点）作为素材，用 LLM
（MiniMax M3）按拟态矛盾参数加工成传播学视角的叙述正文，产出到
Obsidian 仓库成为笔记网络。交互形态对标 MindEcho 的加工向导
（素材多选 → 参数 → 生成定稿）。

**产出形态（用户定稿）**：一篇笔记 = 拟态正文 + 尾部"关联知识点"
（[[wiki-link]]）。知识点本身一次性导出为 377 张独立笔记
（frontmatter 带 kp_id/章节），与加工笔记互联成网。

**质量守门**：程序化校验（字数上下限可配 + 知识点引用完整性）+
人工定稿，不引入 LLM 评估环节。

## 2. 总体架构（方案 A：双件套）

```
D:\Lab\obsidian-fake-news\
├─ migrate/                    # 一次性迁移（Python，跑完即弃）
│  ├─ migrate.py               # knowledge.db → 知识点md + conflicts 种子
│  └─ README.md                # 用法与"一次性"边界说明
├─ plugin/                     # Obsidian 插件（TypeScript，长期工件）
│  ├─ src/
│  │  ├─ main.ts               # ribbon/命令注册、知识点索引扫描
│  │  ├─ wizard/               # 两页式向导
│  │  │  ├─ picker.ts          # 素材搜索多选（fuzzy，扫知识点笔记）
│  │  │  ├─ params.ts          # 参数页（维度全部配置驱动动态渲染）
│  │  │  └─ compose.ts         # 生成定稿页（核心段只读+外壳可编辑+校验）
│  │  ├─ llm.ts                # requestUrl → MiniMax；剥 <think>；5xx 重试×2
│  │  ├─ render.ts             # 落盘（frontmatter 参数快照 + 正文 + 链接）
│  │  ├─ settings.ts           # 设置页三块（见 §4）
│  │  └─ prompt.ts             # 四层注入 prompt 构造（迁移自 MindEcho llm.rs）
│  ├─ assets/seed/
│  │  ├─ conflicts.json        # 矛盾组种子（migrate 产出，GUI 导入后可演化）
│  │  └─ presets.json          # 参数维度 schema + 预设值种子
│  ├─ manifest.json / styles.css / esbuild.config.mjs / package.json
│  └─ versions.json
├─ docs/
│  ├─ 2026-09-16-fake-news-design.md   # 本文档
│  └─ HANDOFF.md               # 给接手 agent 的记忆移交（见 §7）
└─ AGENTS.md
```

Obsidian 插件工程按**官方 sample-plugin 最新模板**脚手架（manifest
minAppVersion、isDesktopOnly、esbuild 流程以官方仓库为准——不凭记忆写
插件 API）。

## 3. 数据流

1. **migrate（一次）**：读 MindEcho `data/knowledge.db`（快照拷贝，不回写
   上游）→ 产出 Obsidian 仓库 `知识点/<章>-<章标题>/<kp_id>-<标题>.md`
   （frontmatter: kp_id / chapter / chapter_title / source；正文：定义 +
   要点）；读 `data/conflicts/*.json` → `plugin/assets/seed/conflicts.json`。
   上游知识库更新需重跑 migrate（一次性任务的既定语义）。
2. **插件索引**：启动/打开向导时扫描仓库 `知识点/` 目录 frontmatter，
   内存索引（kp_id → 标题/章节/摘要）。
3. **加工**：Ribbon 图标或命令面板"Fake News: 加工知识点" → fuzzy 搜索
   多选知识点 → 参数页 → 生成（M3，约 0.5~1 分钟）→ 定稿页编辑 → 校验
   → 写入 `加工/YYYY-MM-DD-<标题>.md`。

## 4. 配置体系（平台化原则：全部运行时可编辑）

设置页三块：

1. **API**：api_key / base_url（默认国内端点 `https://api.minimaxi.com/v1`）/
   model（默认 `MiniMax-M3`）/ 输出目录（默认 `加工/`）。
2. **矛盾组管理（GUI CRUD）**：设置页列矛盾组（增删）→ 点开进编辑
   Modal：世界观、禁忌词条、子矛盾列表——每个子矛盾含立场 A/B 的
   名称/核心主张/关键词。存储走 Obsidian 插件标准 `loadData/saveData`
   （`data.json`）；`assets/seed/conflicts.json` 仅作首启一键导入种子。
3. **参数预设管理**：各维度（立场策略/叙事框架/媒介/语气/目标字数…）
   的可选值 GUI 增删；**维度体系本身开放**——presets.json 定义维度
   schema（id/标签/控件类型/可选值），向导参数页动态渲染，新增自定义
   维度（如"受众视角"）只改配置不改代码。

插件代码对内容保持齐次无约束；prompt 收到的是数据，不感知结构细节。

## 5. LLM 调用约定

- `requestUrl`（Obsidian API，无 CORS 限制）POST `{base_url}/chat/completions`。
- **必须剥 `<think>…</think>` 前缀**（M3 为推理模型；历史教训：不剥会
  污染正文与 JSON 解析）。
- 5xx/网络错误重试 2 次（指数退避）。
- prompt：迁移 MindEcho llm.rs 的四层注入结构（世界观 → 子矛盾与立场 →
  叙事参数 → 知识点素材），文本随迁并按 Obsidian 场景微调（去掉游戏化
  表述）。
- 校验：正文字数（默认 500~3000，可配）+ 尾部知识点引用完整性。

## 6. 产物契约

`加工/YYYY-MM-DD-<标题>.md`：

```markdown
---
title: <定稿标题>
created: <ISO 日期>
model: MiniMax-M3
conflict: <矛盾组id>/<子矛盾id>
params: { 立场策略: 两面性, 叙事框架: 新闻, 媒介: 图文, 语气: 克制, ... }
kp_ids: [199, 205]
---

<拟态正文>

## 关联知识点

- [[199-服务目录管理]] — <一句话说明本文如何使用它>
- [[205-服务级别协议]] — ...
```

知识点笔记 frontmatter 契约（migrate 产出，插件读取）：

```yaml
kp_id: 199
chapter: "3"
chapter_title: IT服务管理
source: 新版教程
```

## 7. 记忆移交（docs/HANDOFF.md 内容要求）

给接手 agent 的必要记忆（**自包含，不依赖任何外部项目上下文**），
实施阶段产出，至少覆盖：

1. **MiniMax 平台事实**：key 属国内平台（api.minimaxi.com；国际站 401）；
   OpenAI 兼容 /chat/completions；M3 与 M2.x 全系是推理模型——回复带
   `<think>` 前缀必须剥离；M3 生成约 0.5~1 分钟/篇。
2. **prompt 结构说明**：四层注入（世界观 → 子矛盾与立场 → 叙事参数 →
   知识点素材）、think 剥离与重试策略——随 `src/prompt.ts` / `src/llm.ts`
   内联注释自描述（迁移期的来源对照仅供实施者，不进交接文档）。
3. **知识库契约**：frontmatter 字段、kp_id 唯一性、迁移工具的一次性语义
   （db 快照拷贝不回写；知识库更新需重跑 migrate）。
4. **交付边界**：产物自带运行时全部信息（frontmatter 自描述、配置随
   插件 data.json 与 presets.json）。
5. **环境事实（Windows）**：PowerShell 5.1 编码坑（UTF-8 中文 body 须
   bytes、.ps1 ASCII-only）；本环境命令偶发双发（写文件用追加/幂等设计）；
   长驻服务用分离进程。
6. **Obsidian 插件开发事实**：以官方 sample-plugin 为 API 真源，不凭
   记忆写；requestUrl 绕 CORS；loadData/saveData 为配置存储。

## 8. 验收标准

1. migrate 在目标仓库产出 377 张知识点笔记（数量与 knowledge.db 一致）。
2. 插件装进 Obsidian：Ribbon → 搜索选 2 个知识点 → 设参 → 生成 →
   编辑 → 落盘，产物符合 §6 契约，wiki-link 可跳转。
3. 矛盾组 GUI 增删改后，下次向导参数页即时生效。
4. 自定义新参数维度（仅改 presets.json）在向导中可用并进入产物
   frontmatter。
5. 断网/5xx 时向导给出可读错误，重试后可恢复。
