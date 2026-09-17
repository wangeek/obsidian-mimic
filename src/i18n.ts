/** i18n 模块（沿用 obsidian-lottery 模板模式）：
 * EN 为基准字典（as const），TranslationKey 保证 ZH/EN 键同步（遗漏编译报错）；
 * 基于 Obsidian UI 语言（window.moment.locale()）自动切换 zh / en；
 * 配方内容属用户数据不翻译，插件 UI chrome 双语。
 */

export const EN = {
	// ----- main.ts -----
	'main.ribbon.tooltip': 'Mimic: compose notes',
	'main.command.compose': 'Mimic: knowledge notes → mimic note',
	'main.command.composeCurrent': 'Mimic: compose current note',
	'main.command.importSeeds': 'Import seed recipes (append, no overwrite)',
	'main.notice.noKnowledge': 'No knowledge notes under the configured folder — run the migrate tool first, or check the folder setting',
	'main.notice.noRecipes': 'No recipes yet — create one in settings, or run "Import seed recipes"',
	'main.notice.noActiveNote': 'No note is open — open one in the editor first, then run this command',
	'main.notice.seedsExist': 'Seed recipes already present; nothing imported',
	'main.notice.seedsImported': 'Imported {count} seed recipe(s) — free to remix in settings',

	// ----- picker.ts -----
	'picker.title': 'Mimic · pick material',
	'picker.current.name': 'Current note',
	'picker.current.desc': 'Skip the folder list and use the note you are editing (not limited to the knowledge folder)',
	'picker.current.button': 'Use "{title}"',
	'picker.folder.name': 'Pick from knowledge folder',
	'picker.search.placeholder': 'Search: title / chapter / id',
	'picker.next.empty': 'Next: set params',
	'picker.next.count': 'Next: set params ({count} selected)',
	'picker.row.meta': 'Ch.{chapter} {chapterTitle}',
	'picker.empty': '(No matching notes; check the knowledge folder setting and migration)',

	// ----- wizard.ts -----
	'wizard.title': 'Mimic · compose',
	'wizard.material.plain': 'Material: {list}',
	'wizard.material.more': 'Material: {list} and {count} more',
	'wizard.recipe': 'Recipe',
	'wizard.stage': 'Stage: {worldview}',
	'wizard.generate': 'Compose',
	'wizard.generating': 'Composing ({model}, ~0.5–1 min)…',
	'wizard.failed': 'Compose failed: {msg} (go back and retry)',
	'wizard.badShape': 'Response missing title / core_segment / narrative_shell',
	'wizard.title.label': 'Title',
	'wizard.core.note': 'Core segment (mimicry floor: the densest knowledge, locked)',
	'wizard.shell.note': 'Narrative shell (the distortion layer, editable)',
	'wizard.links.note': 'Related-note blurbs (go into the tail links; empty = chapter note only)',
	'wizard.link.placeholder': 'One line: how this piece uses the note',
	'wizard.back': '← Params',
	'wizard.write': 'Write note',
	'wizard.validate.under': 'Too short ({words} < {min})',
	'wizard.validate.over': 'Too long ({words} > {max})',
	'wizard.notice.validateFailed': 'Validation failed: {msg}',
	'wizard.notice.written': 'Written: {path}',
	'wizard.notice.writeFailed': 'Write failed: {msg}',

	// ----- llm.ts -----
	'llm.noJson': 'No JSON object in the response',
	'llm.jsonUnclosed': 'JSON object not closed',
	'llm.jsonInvalid': 'Invalid JSON ({msg}) near {ctx}',
	'llm.noContent': 'Unexpected response shape (no content)',
	'llm.failed': 'LLM call failed (retries exhausted): {msg}',

	// ----- render.ts -----
	'render.relatedHeading': '## Related notes',
	'render.chapterNote': '(Ch.{chapter} {chapterTitle})',
	'render.untitled': 'untitled',

	// ----- settings.ts -----
	'settings.api.heading': 'API',
	'settings.api.key': 'API Key (MiniMax domestic platform)',
	'settings.api.baseUrl': 'Base URL',
	'settings.api.model': 'Model',
	'settings.api.knowledgeDir': 'Knowledge folder (vault-relative)',
	'settings.api.outputDir': 'Output folder (vault-relative)',
	'settings.api.minWords': 'Word-count floor',
	'settings.api.maxWords': 'Word-count ceiling',
	'settings.recipes.heading': 'Mimic recipes (prompt parameter sets: imitate × distort)',
	'settings.recipes.slotCount': '{count} slot(s)',
	'settings.recipes.stage': 'Stage: {stage}',
	'settings.recipes.edit': 'Edit',
	'settings.recipes.delete': 'Delete',
	'settings.recipes.new': '＋ New recipe',
	'settings.edit.title': 'Edit recipe: {name}',
	'settings.edit.name': 'Name',
	'settings.edit.id': 'Recipe id (machine code, recorded in output)',
	'settings.edit.stage': 'Stage: which world does the story live in? (optional)',
	'settings.edit.stageDesc': 'e.g. "Journey to the West". Empty = plain real-world register',
	'settings.edit.forbidden': 'Taboos: hard red lines (semicolon-separated)',
	'settings.edit.forbiddenDesc': 'e.g. no fabricated data; core definitions must stay correct',
	'settings.edit.slotsHeading': 'Slots (wizard inputs; each slot = one sentence into the instruction + your value)',
	'settings.edit.delete': 'Delete',
	'settings.edit.addSlot': '＋ Slot',
	'settings.edit.save': 'Save',
	'settings.edit.idNameRequired': 'id / name are required',
	'settings.slot.id': 'Slot id (machine code, recorded in output)',
	'settings.slot.label': 'Display name (shown in the wizard)',
	'settings.slot.inputType': 'Input type',
	'settings.slot.type.select': 'Dropdown (single)',
	'settings.slot.type.number': 'Number',
	'settings.slot.type.text': 'Free text',
	'settings.slot.deflt': 'Default value',
	'settings.slot.prompt': 'Sentence injected into the instruction ({value} = user value, {label} = display name)',
	'settings.slot.promptDesc': 'This line is sent to the AI together with the filled value. e.g. "Explain the knowledge in the voice of {value}"',
	'settings.slot.values': 'Dropdown options (dropdown type only; comma-separated)',
	'settings.slot.min': 'Number floor (optional)',
	'settings.slot.max': 'Number ceiling (optional)',
	'settings.slot.newLabel': 'New slot',
	'settings.slot.option1': 'Option 1',
	'settings.slot.option2': 'Option 2',
	'settings.guide.summary': 'How recipes work (plain words + the mechanism)',
	'settings.guide.html': `
<p><b>A recipe is a writing work order:</b> it tells the AI <b>which world to tell the story in (stage), what is forbidden (taboos), and which lines to write by (slots)</b>.</p>
<p><b>How it works (prompt injection, one-liner):</b> when you hit "Compose", the plugin assembles your config into one instruction for the LLM —</p>
<ul>
  <li>[Worldview] ← the stage (where the story happens)</li>
  <li>[Imitate-distort params] ← one line per slot: the slot's sentence template + your value</li>
  <li>[Knowledge material] ← the notes you checked</li>
  <li>[Taboos] ← the red lines</li>
</ul>
<p>The model only sees this assembled text. So: <b>the plugin understands nothing about content — it only assembles</b>. Add or edit slots freely; the more specific the lines, the more controllable the output. Any structure is yours to compose.</p>
<p><b>The built-in "Journey to the West" recipe shows it all:</b> the stage is the pilgrimage road; pick Sun Wukong as narrator and the AI speaks like the Monkey King; fill the "difficulty as a demon" slot with "Mist Demon of Concepts" and the hardest part becomes a battle to be won by understanding the knowledge; slide "playfulness" from 0 (straight from the book) to 1 (wildly imaginative) while the taboos keep core definitions correct — <b>that is "imitate" (knowledge must stay right) × "distort" (the telling may roam)</b>.</p>
<p>To build your own: new recipe → add a slot. E.g. a "Narrator voice" (dropdown) slot with the sentence <code>Explain the knowledge in the voice of {value}</code> and options like Old Professor / Science Host / Stand-up Comedian — instant voice switching.</p>`,
} as const;

export type TranslationKey = keyof typeof EN;

export const ZH: Record<TranslationKey, string> = {
	// ----- main.ts -----
	'main.ribbon.tooltip': 'Mimic 拟态加工',
	'main.command.compose': '拟态加工：知识点 → 拟态笔记',
	'main.command.composeCurrent': '拟态加工：加工当前笔记',
	'main.command.importSeeds': '导入示范配方（追加，不覆盖已有）',
	'main.notice.noKnowledge': '「{dir}/」下没有知识点笔记——请先运行 migrate 工具或检查设置里的目录',
	'main.notice.noRecipes': '还没有配方——请在设置中新建，或运行「导入示范配方」',
	'main.notice.noActiveNote': '当前没有打开的笔记——先在编辑区打开一篇再运行此命令',
	'main.notice.seedsExist': '示范配方已存在，未重复导入',
	'main.notice.seedsImported': '已导入 {count} 个示范配方（设置中可自由改造）',

	// ----- picker.ts -----
	'picker.title': 'Mimic · 选择加工素材',
	'picker.current.name': '当前笔记',
	'picker.current.desc': '不想从目录里挑？直接拿正在编辑的这篇当素材（不受知识点目录限制）',
	'picker.current.button': '用「{title}」作素材',
	'picker.folder.name': '从知识点目录勾选',
	'picker.search.placeholder': '搜索：标题 / 章节 / 编号',
	'picker.next.empty': '下一步：设置参数',
	'picker.next.count': '下一步：设置参数（已选 {count}）',
	'picker.row.meta': '第{chapter}章 {chapterTitle}',
	'picker.empty': '（无匹配知识点；确认知识点目录设置正确且已迁移）',

	// ----- wizard.ts -----
	'wizard.title': 'Mimic · 拟态加工',
	'wizard.material.plain': '素材：{list}',
	'wizard.material.more': '素材：{list} 等 {count} 篇',
	'wizard.recipe': '配方',
	'wizard.stage': '舞台：{worldview}',
	'wizard.generate': '生成',
	'wizard.generating': '生成中（{model}，约 0.5~1 分钟）…',
	'wizard.failed': '生成失败：{msg}（可返回参数页重试）',
	'wizard.badShape': '回复缺少 title / core_segment / narrative_shell',
	'wizard.title.label': '标题',
	'wizard.core.note': '核心段（模仿底线：知识密度最高，不再编辑）',
	'wizard.shell.note': '叙事外壳（扭曲层，可编辑定稿）',
	'wizard.links.note': '关联知识点说明（写进文尾链接；留空则只注章节）',
	'wizard.link.placeholder': '一句话：本文如何使用它',
	'wizard.back': '← 参数',
	'wizard.write': '写入笔记',
	'wizard.validate.under': '字数不足（{words} < {min}）',
	'wizard.validate.over': '字数超出（{words} > {max}）',
	'wizard.notice.validateFailed': '校验未通过：{msg}',
	'wizard.notice.written': '已写入：{path}',
	'wizard.notice.writeFailed': '写入失败：{msg}',

	// ----- llm.ts -----
	'llm.noJson': '回复中没有 JSON 对象',
	'llm.jsonUnclosed': 'JSON 对象未闭合',
	'llm.jsonInvalid': 'JSON 不合法（{msg}）出错位置附近：{ctx}',
	'llm.noContent': '回复结构异常（无 content）',
	'llm.failed': 'LLM 调用失败（已重试）：{msg}',

	// ----- render.ts -----
	'render.relatedHeading': '## 关联知识点',
	'render.chapterNote': '（第{chapter}章 {chapterTitle}）',
	'render.untitled': '未命名',

	// ----- settings.ts -----
	'settings.api.heading': 'API',
	'settings.api.key': 'API Key（MiniMax 国内平台）',
	'settings.api.baseUrl': 'Base URL',
	'settings.api.model': '模型',
	'settings.api.knowledgeDir': '知识点目录（vault 相对）',
	'settings.api.outputDir': '输出目录（vault 相对）',
	'settings.api.minWords': '字数下限',
	'settings.api.maxWords': '字数上限',
	'settings.recipes.heading': '拟态配方（模仿-扭曲的提示词参数集）',
	'settings.recipes.slotCount': '{count} 个槽位',
	'settings.recipes.stage': '舞台：{stage}',
	'settings.recipes.edit': '编辑',
	'settings.recipes.delete': '删除',
	'settings.recipes.new': '＋ 新建配方',
	'settings.edit.title': '编辑配方：{name}',
	'settings.edit.name': '名称',
	'settings.edit.id': 'id（配方的英文代号，进产物记录）',
	'settings.edit.stage': '舞台：故事发生在哪个世界？（可空）',
	'settings.edit.stageDesc': '例："西游取经世界"。留空 = 按现实语境正经写',
	'settings.edit.forbidden': '禁则：什么是红线？（分号分隔）',
	'settings.edit.forbiddenDesc': '例：不编造数据；核心定义必须讲对',
	'settings.edit.slotsHeading': '槽位（向导里的输入框；每个槽位 = 一句拼进指令的话 + 你填的值）',
	'settings.edit.delete': '删除',
	'settings.edit.addSlot': '＋ 槽位',
	'settings.edit.save': '保存',
	'settings.edit.idNameRequired': 'id / 名称必填',
	'settings.slot.id': '槽位 id（英文代号，进产物记录）',
	'settings.slot.label': '显示名（向导里展示的名字）',
	'settings.slot.inputType': '输入方式',
	'settings.slot.type.select': '下拉单选',
	'settings.slot.type.number': '数字',
	'settings.slot.type.text': '自由文本',
	'settings.slot.deflt': '默认值',
	'settings.slot.prompt': '拼进指令的句子（{value}=用户填的值，{label}=显示名）',
	'settings.slot.promptDesc': '生成时这行字会连同用户填写的值一起发给 AI。例：以{value}的口吻复述知识',
	'settings.slot.values': '下拉选项（仅"下拉单选"；逗号分隔）',
	'settings.slot.min': '数字最小值（可空）',
	'settings.slot.max': '数字最大值（可空）',
	'settings.slot.newLabel': '新槽位',
	'settings.slot.option1': '选项1',
	'settings.slot.option2': '选项2',
	'settings.guide.summary': '配方怎么用（大白话 + 工作原理）',
	'settings.guide.html': `
<p><b>配方就是一张"写作任务单"：</b>告诉 AI <b>在哪个世界讲故事（舞台）、什么不许干（禁则）、按哪几句话来写（槽位）</b>。</p>
<p><b>工作原理（prompt 注入，一句话版）：</b>点"生成"时，插件把你的配置拼成一段指令发给大模型——</p>
<ul>
  <li>【世界观】← 舞台（故事发生在哪儿）</li>
  <li>【模仿-扭曲参数】← 每个槽位一行：槽位的句子模板 + 你填的值</li>
  <li>【知识素材】← 你勾选的笔记原文</li>
  <li>【禁则】← 红线清单</li>
</ul>
<p>模型只看这段拼出来的字。所以：<b>插件本身不懂内容，只负责拼装</b>——槽位随便加、随便改，写得越具体，文章走向越可控；一切结构都由你组合。</p>
<p><b>看内置的"西游新传"配方就懂了：</b>舞台是取经路；"谁来讲解"选孙悟空，AI 就用猴哥的口气讲；"难点变妖怪"填"概念迷雾妖"，最难懂的知识点就变成一场要降的妖；"发挥程度"从 0（照书正经讲）拉到 1（天马行空），但禁则保证核心定义永远讲对——<b>这就是"模仿"（知识不许错）×"扭曲"（说法放开变）</b>。</p>
<p>想自己搭：新建配方 → 加槽位。比如槽位"模仿姿态"（单选），句子填 <code>以{value}的口吻复述知识</code>，选项写 老教授 / 科普主播 / 相声演员，就能一键换讲法。</p>`,
};

export type Locale = 'zh' | 'en';

const DICTS: Record<Locale, Record<TranslationKey, string>> = {
	en: EN as Record<TranslationKey, string>,
	zh: ZH,
};

let activeLocale: Locale = 'en';

/** 从 window.moment.locale() 推断语言（zh* → zh）；onload 时调用一次 */
export function initLocale(): void {
	const moment = (window as { moment?: { locale?: () => string } }).moment;
	const loc = (moment?.locale?.() ?? 'en').toLowerCase();
	activeLocale = loc.startsWith('zh') ? 'zh' : 'en';
}

export function getLocale(): Locale {
	return activeLocale;
}

type Params = Record<string, string | number>;

export function t(key: TranslationKey, params?: Params): string {
	let str = DICTS[activeLocale]?.[key] ?? EN[key];
	if (str === undefined) {
		console.warn(`[mimic] missing translation: ${key}`);
		str = key;
	}
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			str = str.replace(`{${k}}`, String(v));
		}
	}
	return str;
}
