/** 四层注入生成 prompt（结构内联自证，维护者无需外部上下文）。
 *
 * 层次：世界观 → 拟态矛盾（立场A/B） → 加工参数 → 知识素材。
 * 输出严格 JSON：{title, core_segment, narrative_shell}。
 */

const GENERATE_SYSTEM = `你是传播学助记实验的内容加工引擎。你将收到【世界观】【拟态矛盾】【加工参数】【知识素材】，按参数把知识素材加工成一篇可传播的文章。
硬性规则：
1. 核心定义必须原样或等价出现在文中（不得歪曲、不得编造知识点中不存在的事实与数据）。
2. 不映射现实国家/地区；冲突一律通过【世界观】中的虚构双方表达。
3. 文章结构分为两段输出（JSON）：core_segment（核心段，知识密度最高的 150~300 字，定稿后不再编辑）与 narrative_shell（叙事外壳，其余全文，可编辑）。
4. 输出严格 JSON：{"title": "...", "core_segment": "...", "narrative_shell": "..."}，无其他文字。`;

export interface PromptPoint {
	title: string;
	coreDefinition: string;
	keyPoints: string;
}

export interface PromptArgs {
	worldview: string;
	conflictName: string;
	baseConflict: string;
	stanceAName: string;
	stanceAClaim: string;
	stanceBName: string;
	stanceBClaim: string;
	/** 加工参数行（由维度配置渲染，如"立场策略：两面性；叙事框架：新闻；…"） */
	paramsLine: string;
	points: PromptPoint[];
	relatedTitles: string;
	forbidden: string;
}

function fill(tpl: string, pairs: [string, string][]): string {
	let out = tpl;
	for (const [k, v] of pairs) {
		out = out.split(`{${k}}`).join(v);
	}
	return out;
}

const GENERATE_USER = `【世界观】{worldview}
【拟态矛盾】{conflict_name}（基础冲突度 {base_conflict}）
立场A：{stance_a_name}——{stance_a_claim}
立场B：{stance_b_name}——{stance_b_claim}
【加工参数】{params_line}
【知识素材】（可为一个或多个知识点；多知识点时须全部自然融入，不得遗漏任何一条核心定义）
{points}
【关联知识点】{related_titles}
【禁则】{forbidden}`;

export function buildGeneratePrompt(a: PromptArgs): { system: string; user: string } {
	const points = a.points
		.map((p, i) => `知识点${i + 1}：${p.title}\n核心定义：${p.coreDefinition}\n关键要点：${p.keyPoints}`)
		.join('\n\n');
	const user = fill(GENERATE_USER, [
		['worldview', a.worldview],
		['conflict_name', a.conflictName],
		['base_conflict', a.baseConflict],
		['stance_a_name', a.stanceAName],
		['stance_a_claim', a.stanceAClaim],
		['stance_b_name', a.stanceBName],
		['stance_b_claim', a.stanceBClaim],
		['params_line', a.paramsLine],
		['points', points],
		['related_titles', a.relatedTitles],
		['forbidden', a.forbidden],
	]);
	return { system: GENERATE_SYSTEM, user };
}
