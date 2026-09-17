/** Mimic 主入口：ribbon/命令/文件右键菜单注册、素材构造、种子导入 */
import { Menu, Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, SEED_RECIPES, type KpNote, type MimicSettings } from './types';
import { ComposeWizard } from './wizard';
import { MimicSettingTab } from './settings';
import { initLocale, t } from './i18n';

export default class MimicPlugin extends Plugin {
	settings: MimicSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();
		initLocale();

		this.addRibbonIcon('quote-glyph', t('main.ribbon.tooltip'), () => { this.composeActive(); });
		this.addCommand({
			id: 'compose-current',
			name: t('main.command.composeCurrent'),
			callback: () => { this.composeActive(); },
		});
		this.addCommand({
			id: 'import-seed-recipes',
			name: t('main.command.importSeeds'),
			callback: () => { void this.importSeedRecipes(); },
		});
		this.addSettingTab(new MimicSettingTab(this.app, this));

		// 文件浏览器右键：单选 = 加工此笔记（file-menu）；
		// 多选 = 对选中的 N 个文件加工（files-menu，官方事件直接携带选择集）
		this.registerEvent(this.app.workspace.on('file-menu', (menu: Menu, file) => {
			if (!(file instanceof TFile) || file.extension !== 'md') return;
			menu.addItem(item => item
				.setTitle(t('main.menu.composeOne'))
				.setIcon('quote-glyph')
				.onClick(() => { this.composeFiles([file]); }));
		}));
		this.registerEvent(this.app.workspace.on('files-menu', (menu: Menu, files: TAbstractFile[]) => {
			const tfiles = files.filter((f): f is TFile => f instanceof TFile && f.extension === 'md');
			if (!tfiles.length) return;
			menu.addItem(item => item
				.setTitle(t('main.menu.composeMany', { count: tfiles.length }))
				.setIcon('quote-glyph')
				.onClick(() => { this.composeFiles(tfiles); }));
		}));
	}

	/** 入口一：加工当前打开的笔记 */
	private composeActive() {
		const kp = this.buildKpFromFile(this.app.workspace.getActiveFile());
		if (!kp) {
			new Notice(t('main.notice.noActiveNote'));
			return;
		}
		new ComposeWizard(this.app, this, [kp]).open();
	}

	/** 入口二：加工右键选中的一批文件 */
	private composeFiles(files: TFile[]) {
		const kps = files.map(f => this.buildKpFromFile(f)).filter((k): k is KpNote => k !== null);
		if (!kps.length) return;
		new ComposeWizard(this.app, this, kps).open();
	}

	/** 任意笔记 → 素材项：带 kp_id 的按知识点处理，否则作为库外笔记（external） */
	buildKpFromFile(f: TFile | null): KpNote | null {
		if (!f || f.extension !== 'md') return null;
		const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
		const kpId = parseInt(String(fm?.kp_id ?? ''), 10);
		const known = Number.isFinite(kpId);
		return {
			kpId: known ? kpId : 0,
			title: String(fm?.title ?? f.basename),
			chapter: known ? String(fm?.chapter ?? '') : '',
			chapterTitle: known ? String(fm?.chapter_title ?? '') : '',
			section: known ? String(fm?.section ?? '') : '',
			path: f.path,
			definition: String(fm?.core_definition ?? ''),
			external: !known,
		};
	}

	/** 读取知识点笔记全文（prompt 素材兜底） */
	async readKpContent(path: string): Promise<string> {
		const f = this.app.vault.getAbstractFileByPath(path);
		if (f instanceof TFile) {
			return await this.app.vault.cachedRead(f);
		}
		return '';
	}

	/** 读取知识点素材：正文小节（核心定义/关键要点）+ 无小节时的开头摘录。
	 * 契约：migrate 把定义/要点写在正文小节而非 frontmatter（见 migrate/README.md），
	 * 索引里的 definition 仅在手工把 core_definition 写进 frontmatter 时有值。 */
	async readKpSections(path: string): Promise<{ coreDefinition: string; keyPoints: string; excerpt: string }> {
		const content = await this.readKpContent(path);
		return {
			coreDefinition: extractSection(content, '核心定义'),
			keyPoints: extractSection(content, '关键要点'),
			excerpt: stripFrontmatter(content).slice(0, 300),
		};
	}

	private async importSeedRecipes() {
		const have = new Set(this.settings.recipes.map(r => r.id));
		const adding = SEED_RECIPES.filter(r => !have.has(r.id));
		if (!adding.length) {
			new Notice(t('main.notice.seedsExist'));
			return;
		}
		this.settings.recipes.push(...JSON.parse(JSON.stringify(adding)));
		await this.saveSettings();
		new Notice(t('main.notice.seedsImported', { count: adding.length }));
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
		// 仅首启（或旧版无配方数据）注入示范配方；用户删空后不复活
		if (data == null || !Array.isArray(data.recipes)) {
			this.settings.recipes = JSON.parse(JSON.stringify(SEED_RECIPES));
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

/** 去掉 YAML frontmatter，返回正文 */
function stripFrontmatter(content: string): string {
	return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

/** 提取正文小节："## <heading>" 到下一个标题（#~###）之前的文本；无则空串 */
function extractSection(content: string, heading: string): string {
	const lines = stripFrontmatter(content).split(/\r?\n/);
	const start = lines.findIndex(l =>
		/^##(?!#)\s/.test(l) && l.replace(/^##(?!#)\s*/, '').trim() === heading);
	if (start < 0) return '';
	const out: string[] = [];
	for (let i = start + 1; i < lines.length; i++) {
		if (/^#{1,3}\s/.test(lines[i])) break;
		out.push(lines[i]);
	}
	return out.join('\n').trim();
}
