/** Mimic 类型与数据契约（自包含，不依赖外部项目上下文）
 *
 * 核心抽象：拟态 = 模仿（忠实镜像知识）× 扭曲（受控变形）。
 * 配方（Recipe）是一次拟态变换的全部提示词参数：世界观/禁则 + 提示词槽位。
 * 槽位只是数据——插件对配方内容保持齐次，新增槽位/新配方不改代码。
 */

/** 提示词槽位：向导渲染一个控件，prompt 片段由模板生成 */
export interface RecipeSlot {
	id: string;          // 进产物 frontmatter params 的键名
	label: string;       // 向导显示
	type: 'select' | 'number' | 'text';
	/** prompt 片段模板，{value} 占位替换为用户值；空则用 "{label}：{value}" */
	prompt?: string;
	values?: string[];   // select 可选值（GUI 可增删）
	deflt?: string;
	min?: number;
	max?: number;
}

/** 拟态配方 */
export interface MimicRecipe {
	id: string;
	name: string;
	/** 模仿发生的虚构舞台（如"糖果国 vs 齿轮国"），可空 */
	worldview: string;
	/** 扭曲边界（禁则），分号拼接进 prompt */
	forbidden: string[];
	slots: RecipeSlot[];
}

/** 知识点笔记的内存索引项（扫描 frontmatter 得到） */
export interface KpNote {
	kpId: number;
	title: string;
	chapter: string;
	chapterTitle: string;
	section: string;
	path: string;
	definition: string;
}

/** 生成结果（LLM 返回的三件套） */
export interface ComposeResult {
	title: string;
	coreSegment: string;
	narrativeShell: string;
}

/** 插件设置（data.json） */
export interface MimicSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	knowledgeDir: string;
	outputDir: string;
	minWords: number;
	maxWords: number;
	recipes: MimicRecipe[];
}

export const DEFAULT_SETTINGS: MimicSettings = {
	apiKey: '',
	baseUrl: 'https://api.minimaxi.com/v1',
	model: 'MiniMax-M3',
	knowledgeDir: '知识点',
	outputDir: '拟态',
	minWords: 500,
	maxWords: 3000,
	recipes: [],
};

/** 内置示范配方（初始配置）：展示槽位的几种典型用法 */
export const SEED_RECIPES: MimicRecipe[] = [
	{
		id: 'industry_trade',
		name: '产业博弈（示范：立场对结构）',
		worldview: '糖果国 vs 齿轮国',
		forbidden: ['不映射现实国家', '不编造数据', '不歪曲定义'],
		slots: [
			{
				id: 'mimic_style', label: '模仿姿态', type: 'select',
				prompt: '知识呈现姿态：{value}',
				values: ['教科书式镜像', '新闻转述', '亲历者口述'],
				deflt: '新闻转述',
			},
			{
				id: 'stance_a', label: '立场A', type: 'text',
				prompt: '立场A（{value}）',
				deflt: '开放自由贸易——分工带来效率与技术外溢',
			},
			{
				id: 'stance_b', label: '立场B', type: 'text',
				prompt: '立场B（{value}）',
				deflt: '区域产业保护——关键环节自主可控优先',
			},
			{
				id: 'distort_vector', label: '扭曲向量', type: 'select',
				prompt: '立场倾斜：{value}',
				values: ['两面平衡', '偏向立场A', '偏向立场B'],
				deflt: '两面平衡',
			},
			{
				id: 'distort_degree', label: '扭曲强度', type: 'number',
				prompt: '夸张与情绪化强度（0~1）：{value}',
				min: 0, max: 1, deflt: '0.5',
			},
			{ id: 'word_count', label: '目标字数', type: 'number', min: 500, max: 3000, deflt: '1200' },
		],
	},
	{
		id: 'news_filter',
		name: '新闻滤镜（示范：轻量自由）',
		worldview: '',
		forbidden: ['不得编造知识点中不存在的事实与数据'],
		slots: [
			{
				id: 'mimic_style', label: '模仿姿态', type: 'select',
				prompt: '以{value}的方式转述知识',
				values: ['晚间新闻', '快讯', '深度报道'],
				deflt: '晚间新闻',
			},
			{
				id: 'headline_bias', label: '标题倾向', type: 'text',
				prompt: '标题的取舍倾向：{value}',
				deflt: '突出反差与冲突感，但不失实',
			},
			{
				id: 'distort_degree', label: '扭曲强度', type: 'number',
				prompt: '渲染强度（0~1）：{value}',
				min: 0, max: 1, deflt: '0.4',
			},
		],
	},
];
