/** Fake News 主入口：ribbon / 命令注册、知识点索引扫描、种子导入 */
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, type FakeNewsSettings, type KpNote, type ParamDim } from './types';
import { KpPickerModal } from './picker';
import { ComposeWizard } from './wizard';
import { FakeNewsSettingTab } from './settings';

const SEED_DIMS: ParamDim[] = [
	{ id: 'stance_mode', label: '立场策略', type: 'select', values: ['两面性', '一面性A', '一面性B'], deflt: '两面性' },
	{ id: 'frame', label: '叙事框架', type: 'select', values: ['新闻', '寓言', '日记', '对话', '投票'], deflt: '新闻' },
	{ id: 'medium', label: '媒介', type: 'select', values: ['图文', '长文', '投票', '地图', '时间线'], deflt: '图文' },
	{ id: 'tone', label: '语气', type: 'select', values: ['克制', '中性', '情绪化'], deflt: '克制' },
	{ id: 'word_count', label: '目标字数', type: 'number', min: 500, max: 3000, deflt: '1200' },
];

export default class FakeNewsPlugin extends Plugin {
	settings: FakeNewsSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('quote-glyph', 'Fake News 加工', () => { void this.startCompose(); });
		this.addCommand({
			id: 'compose',
			name: '加工知识点为拟态笔记',
			callback: () => { void this.startCompose(); },
		});
		this.addCommand({
			id: 'import-seed',
			name: '导入种子配置（维度预设，不覆盖已有矛盾组）',
			callback: () => { void this.importSeed(); },
		});
		this.addSettingTab(new FakeNewsSettingTab(this.app, this));
	}

	/** 素材选择 → 向导 */
	private async startCompose() {
		const notes = this.indexKnowledge();
		if (!notes.length) {
			new Notice(`「${this.settings.knowledgeDir}/」下没有知识点笔记——请先运行 migrate 工具或检查设置里的目录`);
			return;
		}
		const picked = await new KpPickerModal(this.app, notes).openAndWait();
		if (!picked.length) return;
		if (!this.settings.conflicts.length) {
			new Notice('还没有矛盾组——请到设置中添加，或运行 migrate 导入种子');
			return;
		}
		new ComposeWizard(this.app, this, picked).open();
	}

	/** 扫描知识点目录的 frontmatter 建索引 */
	indexKnowledge(): KpNote[] {
		const folder = this.settings.knowledgeDir.replace(/\/$/, '');
		const out: KpNote[] = [];
		const files = this.app.vault.getMarkdownFiles();
		for (const f of files) {
			if (!f.path.startsWith(folder + '/')) continue;
			const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
			const kpId = parseInt(String(fm?.kp_id ?? ''), 10);
			if (!Number.isFinite(kpId)) continue;
			out.push({
				kpId,
				title: String(fm?.title ?? f.basename),
				chapter: String(fm?.chapter ?? ''),
				chapterTitle: String(fm?.chapter_title ?? ''),
				section: String(fm?.section ?? ''),
				path: f.path,
				definition: String(fm?.core_definition ?? ''),
			});
		}
		out.sort((a, b) => a.kpId - b.kpId);
		return out;
	}

	/** 读取知识点笔记全文（prompt 素材用） */
	async readKpContent(path: string): Promise<string> {
		const f = this.app.vault.getAbstractFileByPath(path);
		if (f instanceof TFile) {
			return await this.app.vault.cachedRead(f);
		}
		return '';
	}

	private async importSeed() {
		let changed = false;
		if (!this.settings.dims.length) {
			this.settings.dims = JSON.parse(JSON.stringify(SEED_DIMS));
			changed = true;
		}
		if (changed) {
			await this.saveSettings();
			new Notice('维度预设种子已导入');
		} else {
			new Notice('维度预设已存在，未覆盖（矛盾组请在设置中维护）');
		}
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
		if (!this.settings.dims?.length) {
			this.settings.dims = JSON.parse(JSON.stringify(SEED_DIMS));
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
