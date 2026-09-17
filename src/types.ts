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
	/** true = 库外笔记（如"加工当前笔记"入口）：无 kp_id，不进产物 kp_ids，仅作素材与回链 */
	external?: boolean;
}

/** 生成结果（LLM 返回的三件套 + 关联说明） */
export interface ComposeResult {
	title: string;
	coreSegment: string;
	narrativeShell: string;
	/** 关联知识点的一句话说明（键 = 知识点标题；LLM 可缺省，缺省回退章节注） */
	linkNotes: Record<string, string>;
}

/** 插件设置（data.json） */
export interface MimicSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	outputDir: string;
	minWords: number;
	maxWords: number;
	recipes: MimicRecipe[];
}

export const DEFAULT_SETTINGS: MimicSettings = {
	apiKey: '',
	baseUrl: 'https://api.minimaxi.com/v1',
	model: 'MiniMax-M3',
	outputDir: '拟态',
	minWords: 300,
	maxWords: 800,
	recipes: [],
};

/** 内置示范配方（初始配置）：展示槽位的几种典型用法 */
export const SEED_RECIPES: MimicRecipe[] = [
	{
		id: 'industry_trade',
		name: '产业博弈（示范：双立场结构）',
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
				id: 'distort_vector', label: '偏向哪边', type: 'select',
				prompt: '文章总体偏向：{value}',
				values: ['两面平衡', '偏向立场A', '偏向立场B'],
				deflt: '两面平衡',
			},
			{
				id: 'distort_degree', label: '发挥程度', type: 'number',
				prompt: '戏说发挥程度（0=严肃严谨，1=评书演义）：{value}',
				min: 0, max: 1, deflt: '0.5',
			},
			{ id: 'word_count', label: '目标字数', type: 'number', min: 300, max: 800, deflt: '600' },
		],
	},
	{
		id: 'journey_west',
		name: '西游新传（示范：取经路上讲知识）',
		worldview: '西游取经世界——唐僧师徒一行走在十万八千里的取经路上',
		forbidden: [
			'不映射现实人物与国家',
			'不编造知识点中不存在的事实与数据',
			'核心定义必须讲对：玩笑归玩笑，知识归知识',
		],
		slots: [
			{
				id: 'narrator', label: '谁来讲解', type: 'select',
				prompt: '由{value}向徒弟们讲解本次的知识点，口吻符合其性格',
				values: ['孙悟空', '唐僧', '猪八戒', '观音菩萨', '太白金星'],
				deflt: '孙悟空',
			},
			{
				id: 'demon', label: '难点变妖怪', type: 'text',
				prompt: '把本知识最难懂的部分设定成一个妖怪（或一场劫难），名叫"{value}"；师徒必须靠正确理解知识点才能降服它',
				deflt: '概念迷雾妖',
			},
			{
				id: 'play_degree', label: '发挥程度', type: 'number',
				prompt: '戏说发挥程度（0=基本照书正经讲，1=天马行空放开编，但核心定义始终不许讲错）：{value}',
				min: 0, max: 1, deflt: '0.5',
			},
			{ id: 'word_count', label: '目标字数', type: 'number', min: 300, max: 800, deflt: '600' },
		],
	},
	{
		id: 'news_desk',
		name: 'News Desk (demo: light & free, English)',
		worldview: '',
		forbidden: ['Never invent facts or data not present in the knowledge material'],
		slots: [
			{
				id: 'format', label: 'Format', type: 'select',
				prompt: 'Present the knowledge as a {value}',
				values: ['news broadcast', 'talk-show interview', 'campaign debate'],
				deflt: 'news broadcast',
			},
			{
				id: 'angle', label: 'Angle', type: 'text',
				prompt: 'Headline angle: {value}',
				deflt: 'highlight the tension, stay truthful',
			},
			{
				id: 'play_degree', label: 'Playfulness', type: 'number',
				prompt: 'Dramatic flair (0 = sober reporting, 1 = showtime): {value}',
				min: 0, max: 1, deflt: '0.4',
			},
		],
	},
];
