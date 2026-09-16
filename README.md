# obsidian-fake-news

Fake News — 把知识点笔记加工成拟态叙述笔记的 Obsidian 插件。

选择知识点 → 设定拟态矛盾与叙事参数 → LLM（MiniMax M3）生成 →
编辑定稿 → 写入笔记（正文 + 关联知识点 wiki-link）。

## 安装（开发期）

```powershell
npm install
npm run build
# 拷贝 main.js manifest.json styles.css 到 <vault>/.obsidian/plugins/fake-news/
# Obsidian 设置 → 第三方插件 → 启用 Fake News
```

## 使用

1. `python migrate/migrate.py --src <知识库目录> --vault <仓库>`（一次性）
2. 命令面板 → `Fake News: 导入种子配置`
3. 设置中填 API Key（其余默认即可）；按需增删矛盾组与参数维度
4. 点侧边栏图标 → 搜索多选知识点 → 设参 → 生成 → 写入笔记

## 结构

- `src/` — 插件源码（入口/向导/选择器/设置/LLM/prompt/落盘）
- `migrate/` — 一次性知识库迁移工具（跑完即弃）
- `docs/` — 设计文档与 HANDOFF（接手必读）
- `assets/seed/` — 矛盾组种子（migrate 产出，导入后由设置页演化）

## License

MIT
