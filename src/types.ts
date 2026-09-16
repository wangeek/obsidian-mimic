/** Fake News 类型与数据契约（自包含，不依赖外部项目上下文） */

/** 立场（矛盾的一边） */
export interface Stance {
	name: string;
	core_claim: string;
	keywords: string[];
}

/** 子矛盾（一个具体议题） */
export interface SubConflict {
	id: string;
	stance_a: Stance;
	stance_b: Stance;
	base_conflict: number;
}

/** 矛盾组（可插拔内容，设置页 GUI 可增删改） */
export interface ConflictGroup {
	id: string;
	name: string;
	worldview: string;
	forbidden: string[];
	sub_conflicts: SubConflict[];
}

/** 参数维度 schema（presets；加新维度不改代码） */
export interface ParamDim {
	id: string;          // 进 frontmatter 的键名
	label: string;       // 向导显示
	type: 'select' | 'number';
	values?: string[];   // select 可选值（GUI 可增删）
	deflt?: string;
	min?: number;
	max?: number;
}

/** 知识点笔记的内存索引项（扫描 frontmatter 得到） */
export interface KpNote {
	kpId: number;
	title: string;
	chapter: string;
	chapterTitle: string;
	section: string;
	path: string;        // vault 相对路径
	definition: string;  // 核心定义（正文首段，用于 prompt）
}

/** 生成结果（LLM 返回的三件套） */
export interface ComposeResult {
	title: string;
	coreSegment: string;
	narrativeShell: string;
}

/** 插件设置（data.json） */
export interface FakeNewsSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	knowledgeDir: string;   // 知识点笔记目录（vault 相对）
	outputDir: string;      // 加工产物目录（vault 相对）
	minWords: number;
	maxWords: number;
	conflicts: ConflictGroup[];
	dims: ParamDim[];
}

export const DEFAULT_SETTINGS: FakeNewsSettings = {
	apiKey: '',
	baseUrl: 'https://api.minimaxi.com/v1',
	model: 'MiniMax-M3',
	knowledgeDir: '知识点',
	outputDir: '加工',
	minWords: 500,
	maxWords: 3000,
	conflicts: [],
	dims: [],
};
