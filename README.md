# obsidian-mimic

Mimic — 拟态加工（模仿-扭曲）：把知识点笔记按可配置的提示词配方，
用 LLM（MiniMax M3）加工成传播视角的叙述笔记（正文 + 关联知识点
wiki-link）。

## 安装（开发期）

```powershell
npm install
npm run build
# 拷贝 main.js manifest.json styles.css 到 <vault>/.obsidian/plugins/mimic/
# Obsidian 设置 → 第三方插件 → 启用 Mimic
```

## 使用

1. `python migrate/migrate.py --src <知识库目录> --vault <仓库>`（一次性）
2. 设置中填 API Key（其余默认即可；首启自动带 2 个示范配方）
3. 点侧边栏图标 → 搜索多选知识点 → 选配方、填槽位 → 生成 → 写入笔记

## 配方怎么用（核心概念）

**拟态 = 模仿（忠实镜像知识）× 扭曲（受控变形）**。一个配方 =

| 组成 | 说明 |
|---|---|
| 舞台（worldview） | 模仿发生的虚构舞台（如"糖果国 vs 齿轮国"），可空=现实语境 |
| 禁则（forbidden） | 扭曲的边界（"不编造数据"…） |
| 槽位（slots） | 向导里的输入控件 + 自带 prompt 模板，`{value}` 为用户值 |

**内置示范配方**：

- `产业博弈` —— "立场A/立场B"结构示范：两个 text 槽位（立场主张）+
  倾斜方向 select + 扭曲强度 number + 字数。旧的"矛盾组"就是这样组装的。
- `新闻滤镜` —— 轻量自由示范：模仿姿态 select（晚间新闻/快讯/深度报道）+
  标题倾向 text + 渲染强度 number。

**自定义示例**（设置 → 编辑配方 → 加槽位）：

- 槽位"模仿姿态"（select）：模板 `以{value}的口吻复述知识`，
  可选值：老教授 / 科普作家 / 播客主播
- 槽位"扭曲向量"（text）：模板 `叙述倾向：{value}`，默认"着重考点，弱化争议"
- 槽位"扭曲强度"（number 0~1）：模板 `口语化与戏剧化程度：{value}`

生成时各槽位片段按顺序拼进【模仿-扭曲参数】区；产物 frontmatter 记录
`recipe` 与 `params` 快照。**任何结构都由你组合，插件不加约束。**

## 结构

- `src/` — 插件源码（入口/向导/选择器/设置/LLM/prompt/落盘）
- `migrate/` — 一次性知识库迁移工具（跑完即弃）
- `docs/` — 设计文档与 HANDOFF（接手必读）

## License

MIT
