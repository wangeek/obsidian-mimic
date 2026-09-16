# obsidian-fake-news — agent 工作说明

知识拟态加工 Obsidian 插件（TypeScript + esbuild，官方插件 API）。

## 约定

- **接手必读 `docs/HANDOFF.md`**（平台事实/契约/环境坑，自包含）。
- 设计文档 `docs/2026-09-16-fake-news-design.md` 为唯一需求真源。
- Obsidian API 以官方 sample-plugin 为真源，**不凭记忆写 API**；改动
  涉及 API 时先核对再写。
- 构建验证：`npm run build`（esbuild 产出 main.js，零错误才算过）。
- 迁移工具 `migrate/` 是一次性产物，不做持续维护。
- 矛盾组/参数维度是数据不是代码：功能增强优先走配置扩展，保持插件对
  内容齐次（平台化原则）。

## 环境

- Windows / PowerShell 5.1：`.ps1` ASCII-only；中文 JSON 用文件传递。
- 命令偶发双发：脚本写文件用追加或幂等。
- Node 工程已配 `npm run dev`（watch）/ `npm run build`。
