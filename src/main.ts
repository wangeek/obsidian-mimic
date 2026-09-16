/** Mimic 主入口：ribbon / 命令注册、知识点索引、种子导入 */
import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, SEED_RECIPES, type KpNote, type MimicSettings } from './types';
import { KpPickerModal } from './picker';
import { ComposeWizard } from './wizard';
import { MimicSettingTab } from './settings';

export default class MimicPlugin extends Plugin {
	settings: MimicSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('quote-glyph', 'Mimic 拟态加工', () => { void this.startCompose(); });
		this.addCommand({
			id: 'compose',
			name: '拟态加工：知识点 → 拟态笔记',
			callback: () => { void this.startCompose(); },
		});
		this.addCommand({
			id: 'import-seed-recipes',
			name: '导入示范配方（追加，不覆盖已有）',
			callback: () => { void this.importSeedRecipes(); },
		});
		this.addSettingTab(new MimicSettingTab(this.app, this));
	}

	private async startCompose() {
		const notes = this.indexKnowledge();
		if (!notes.length) {
			new Notice(`「${this.settings.knowledgeDir}/」下没有知识点笔记——请先运行 migrate 工具或检查设置里的目录`);
			return;
		}
		if (!this.settings.recipes.length) {
			new Notice('还没有配方——请在设置中新建，或运行「导入示范配方」');
			return;
		}
		const picked = await new KpPickerModal(this.app, notes).openAndWait();
		if (!picked.length) return;
		new ComposeWizard(this.app, this, picked).open();
	}

	/** 扫描知识点目录的 frontmatter 建索引 */
	indexKnowledge(): KpNote[] {
		const folder = this.settings.knowledgeDir.replace(/\/$/, '');
		const out: KpNote[] = [];
		for (const f of this.app.vault.getMarkdownFiles()) {
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

	/** 读取知识点笔记全文（prompt 素材兜底） */
	async readKpContent(path: string): Promise<string> {
		const f = this.app.vault.getAbstractFileByPath(path);
		if (f instanceof TFile) {
			return await this.app.vault.cachedRead(f);
		}
		return '';
	}

	private async importSeedRecipes() {
		const have = new Set(this.settings.recipes.map(r => r.id));
		const adding = SEED_RECIPES.filter(r => !have.has(r.id));
		if (!adding.length) {
			new Notice('示范配方已存在，未重复导入');
			return;
		}
		this.settings.recipes.push(...JSON.parse(JSON.stringify(adding)));
		await this.saveSettings();
		new Notice(`已导入 ${adding.length} 个示范配方（设置中可自由改造）`);
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
		if (!this.settings.recipes?.length) {
			this.settings.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
