/** 拟态生成 prompt：模仿-扭曲框架（结构内联自证，维护者无需外部上下文）。
 *
 * 模仿底线：核心定义原样或等价出现在文中。
 * 扭曲边界：不编造事实与数据、遵守配方禁则。
 * 【模仿-扭曲参数】区由配方槽位渲染：每个槽位一条 prompt 片段。
 * 输出严格 JSON：{title, core_segment, narrative_shell}。
 */
import type { RecipeSlot } from './types';

const GENERATE_SYSTEM = `你是拟态内容引擎：以"模仿"（忠实镜像知识定义）为基础，按"扭曲"参数做受控变形，把知识素材加工成一篇可传播的文章。
硬性规则：
1. 模仿底线——核心定义必须原样或等价出现在文中。
2. 扭曲边界——不得编造知识点中不存在的事实与数据；遵循【禁则】；如【世界观】非空，冲突一律通过该虚构舞台表达，不映射现实国家/地区。
3. 文章结构分为两段输出（JSON）：core_segment（核心段，知识密度最高的部分，定稿后不再编辑）与 narrative_shell（叙事外壳，其余全文，可编辑）；全文总长度必须遵守【字数要求】。
4. 另在 link_notes 中为【关联知识点】的每个知识点写一句话说明（本文如何使用/呼应它），键为知识点标题。
5. 输出严格 JSON：{"title": "...", "core_segment": "...", "narrative_shell": "...", "link_notes": {"<知识点标题>": "<一句话说明>"} }，除 JSON 外不得输出任何文字（含代码栅栏）。JSON 必须可被解析：字符串值内的英文双引号写成 \\" 或改用中文引号“”；字符串值内禁止裸换行。
6. 语言跟随——输出（标题/正文/link_notes 的值）一律使用【知识素材】的语言：素材为中文则全文中文，素材为英文则全文英文；禁止切换或混杂语言（专有名词除外）。`;

export interface PromptPoint {
	title: string;
	coreDefinition: string;
	keyPoints: string;
}

export interface PromptArgs {
	worldview: string;
	/** 配方槽位渲染出的参数行（每槽位一条） */
	paramsLines: string[];
	points: PromptPoint[];
	relatedTitles: string;
	forbidden: string;
	/** 全文长度硬边界（与落盘校验同一套阈值） */
	minWords: number;
	maxWords: number;
}

/** 槽位值 → prompt 片段（{value}/{label} 占位；未填的槽位跳过） */
export function renderSlot(slot: RecipeSlot, value: string): string | null {
	if (value == null || value === '') return null;
	const tpl = slot.prompt || `${slot.label}：{value}`;
	return tpl.split('{value}').join(value).split('{label}').join(slot.label);
}

export function buildGeneratePrompt(a: PromptArgs): { system: string; user: string } {
	const points = a.points
		.map((p, i) => `知识点${i + 1}：${p.title}\n核心定义：${p.coreDefinition}\n关键要点：${p.keyPoints}`)
		.join('\n\n');
	const params = a.paramsLines.filter(Boolean).join('；\n');
	const target = Math.round(((a.minWords + a.maxWords) / 2) / 10) * 10;
	const user = `【世界观】${a.worldview || '（无虚构舞台，按现实语境写作）'}
【模仿-扭曲参数】
${params}
【知识素材】（可为一个或多个知识点；多知识点时须全部自然融入，不得遗漏任何一条核心定义）
${points}
【关联知识点】${a.relatedTitles}（文末逐一关联；link_notes 为每个标题写一句话说明本文如何使用它）
【字数要求】全文（core_segment + narrative_shell 合计）总长度控制在 ${a.minWords}~${a.maxWords}（中文按字计、英文按词计，专有名词除外）——硬性边界，超限即不合格；目标约 ${target}。
【禁则】${a.forbidden}`;
	return { system: GENERATE_SYSTEM, user };
}

/** JSON 解析失败后的自愈重试指令（prompt 层内容，中文固定，不随 UI 语言切换） */
export function buildJsonRepair(parseError: string): string {
	return `【重试】你上一次的输出不是合法 JSON（解析错误：${parseError}）。请重新输出完整结果：仅一个 JSON 对象，不要代码栅栏与任何多余文字；字符串值内的英文双引号必须转义为 \\" 或改用中文引号“”；字符串值内不得有裸换行。`;
}
