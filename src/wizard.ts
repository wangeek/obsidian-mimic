/** 拟态向导：配方+槽位参数页 → 生成定稿页（编辑+校验+落盘） */
import { App, Modal, Notice, Setting } from 'obsidian';
import type MimicPlugin from './main';
import type { ComposeResult, KpNote } from './types';
import { buildGeneratePrompt, buildJsonRepair, renderSlot } from './prompt';
import { chat, parseJsonLoose } from './llm';
import { writeComposedNote } from './render';
import { t } from './i18n';

/** 全文长度：中文按字计、英文按词计（混合文本加总）——与 prompt 字数要求同一语义 */
function countWords(text: string): number {
	const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
	const rest = text.replace(/[\u4e00-\u9fff]/g, ' ');
	const latinWords = (rest.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
	return cjk + latinWords;
}

export class ComposeWizard extends Modal {
	private plugin: MimicPlugin;
	private kps: KpNote[];
	private recipeIdx = 0;
	private slotValues: Record<string, string> = {};

	private result: ComposeResult | null = null;
	private generating = false;
	private statusEl!: HTMLElement;

	constructor(app: App, plugin: MimicPlugin, kps: KpNote[]) {
		super(app);
		this.plugin = plugin;
		this.kps = kps;
		this.setTitle(t('wizard.title'));
		this.modalEl.addClass('fn-wizard');
	}

	onOpen() {
		this.resetSlotDefaults(0);
		this.renderParams();
	}

	private resetSlotDefaults(recipeIdx: number) {
		this.slotValues = {};
		const r = this.plugin.settings.recipes[recipeIdx];
		for (const s of r?.slots ?? []) {
			this.slotValues[s.id] = s.deflt ?? (s.type === 'number'
				? (s.min != null && s.max != null ? String(Math.round(((s.min + s.max) / 2) * 100) / 100) : '')
				: s.values?.[0] ?? '');
		}
	}

	// ---------- 第 1 页：配方与槽位参数 ----------

	private renderParams() {
		const { contentEl } = this;
		contentEl.empty();
		const names = this.kps.map(k => k.title);
		const label = names.length > 6
			? t('wizard.material.more', { list: names.slice(0, 6).join('、'), count: names.length })
			: t('wizard.material.plain', { list: names.join('、') });
		contentEl.createEl('p', { cls: 'fn-muted', text: label });

		const recipes = this.plugin.settings.recipes;
		new Setting(contentEl).setName(t('wizard.recipe')).addDropdown(dd => {
			recipes.forEach((r, i) => { dd.addOption(String(i), r.name); });
			dd.setValue(String(this.recipeIdx)).onChange(v => {
				this.recipeIdx = parseInt(v, 10);
				this.resetSlotDefaults(this.recipeIdx);
				this.renderParams();
			});
		});

		const r = recipes[this.recipeIdx];
		if (r?.worldview) {
			contentEl.createEl('p', { cls: 'fn-stance-info', text: t('wizard.stage', { worldview: r.worldview }) });
		}

		// 槽位渲染（配方驱动；select/number/text 三种控件）
		for (const s of r?.slots ?? []) {
			const set = new Setting(contentEl).setName(s.label);
			if (s.type === 'select') {
				set.addDropdown(dd => {
					(s.values ?? []).forEach(v => { dd.addOption(v, v); });
					dd.setValue(this.slotValues[s.id] ?? '').onChange(v => { this.slotValues[s.id] = v; });
				});
			} else if (s.type === 'number') {
				set.addText(tx => {
					tx.inputEl.type = 'number';
					if (s.min != null) tx.inputEl.min = String(s.min);
					if (s.max != null) tx.inputEl.max = String(s.max);
					tx.setValue(this.slotValues[s.id] ?? '')
						.onChange(v => { this.slotValues[s.id] = v; });
				});
			} else {
				set.addTextArea(tx => tx
					.setValue(this.slotValues[s.id] ?? '')
					.onChange(v => { this.slotValues[s.id] = v; }));
			}
		}

		new Setting(contentEl).addButton(b => b
			.setButtonText(t('wizard.generate'))
			.setCta()
			.onClick(() => { void this.generate(); }));
	}

	// ---------- 生成 ----------

	private async generate() {
		if (this.generating) return;
		this.generating = true;
		const st = this.plugin.settings;
		const r = st.recipes[this.recipeIdx];
		if (!r) { this.generating = false; return; }

		const paramsLines: string[] = [];
		for (const s of r.slots) {
			let v = (this.slotValues[s.id] ?? '').trim();
			if (s.type === 'number' && v !== '') {
				// 超出槽位 min/max 的数值在生成前钳制回区间
				const n = parseFloat(v);
				if (Number.isFinite(n)) {
					const lo = s.min != null ? s.min : -Infinity;
					const hi = s.max != null ? s.max : Infinity;
					const c = Math.min(hi, Math.max(lo, n));
					if (c !== n) { v = String(c); this.slotValues[s.id] = v; }
				}
			}
			const line = renderSlot(s, v);
			if (line) paramsLines.push(line);
		}

		// 素材：正文小节（核心定义/关键要点）优先，开头摘录兜底；
		// 库外笔记（如"加工当前笔记"）无小节结构，直接用摘录。
		// 注意：素材行属 prompt 内容（LLM 指令），固定中文，不随 UI 语言切换
		const points = await Promise.all(this.kps.map(async k => {
			const sec = await this.plugin.readKpSections(k.path);
			const chapterLine = k.chapter
				? `第${k.chapter}章 ${k.chapterTitle}${k.section ? ' ' + k.section : ''}`
				: (k.external ? '（vault 内普通笔记，全文摘录见上）' : '');
			return {
				title: k.title,
				coreDefinition: k.definition || sec.coreDefinition || sec.excerpt,
				keyPoints: [sec.keyPoints, chapterLine].filter(Boolean).join('\n'),
			};
		}));

		const { system, user } = buildGeneratePrompt({
			worldview: r.worldview,
			paramsLines,
			points,
			relatedTitles: this.kps.map(k => k.title).join('、'),
			forbidden: r.forbidden.join('；') || '不得编造事实与数据',
			minWords: st.minWords,
			maxWords: st.maxWords,
		});

		this.renderGenerating();
		try {
			let raw = await chat(st, system, user, 0.7);
			let v: Record<string, unknown>;
			try {
				v = parseJsonLoose(raw);
			} catch (pe) {
				// 自愈重试：把解析错误反馈给模型，降温重生成一次
				const msg = pe instanceof Error ? pe.message : String(pe);
				raw = await chat(st, system, user + '\n' + buildJsonRepair(msg), 0.3);
				v = parseJsonLoose(raw);
			}
			const linkNotes: Record<string, string> = {};
			const ln = v.link_notes;
			if (ln && typeof ln === 'object' && !Array.isArray(ln)) {
				for (const [tk, note] of Object.entries(ln as Record<string, unknown>)) {
					linkNotes[tk.trim()] = String(note ?? '').trim();
				}
			}
			const res: ComposeResult = {
				title: String(v.title ?? ''),
				coreSegment: String(v.core_segment ?? ''),
				narrativeShell: String(v.narrative_shell ?? ''),
				linkNotes,
			};
			if (!res.title || !res.coreSegment || !res.narrativeShell) {
				throw new Error(t('wizard.badShape'));
			}
			this.result = res;
			this.renderResult();
		} catch (e) {
			this.statusEl.setText(t('wizard.failed', { msg: e instanceof Error ? e.message : String(e) }));
			new Setting(this.contentEl).addButton(b => b
				.setButtonText(t('wizard.back'))
				.onClick(() => this.renderParams()));
		} finally {
			this.generating = false;
		}
	}

	private renderGenerating() {
		const { contentEl } = this;
		contentEl.empty();
		this.statusEl = contentEl.createEl('p', {
			cls: 'fn-muted',
			text: t('wizard.generating', { model: this.plugin.settings.model }),
		});
	}

	// ---------- 第 2 页：定稿 ----------

	private renderResult() {
		const { contentEl } = this;
		contentEl.empty();
		const r = this.result!;

		new Setting(contentEl).setName(t('wizard.title.label')).addText(tx => tx.setValue(r.title).onChange(v => { r.title = v; }));
		contentEl.createEl('p', { text: t('wizard.core.note') });
		const core = contentEl.createEl('textarea', { cls: 'fn-core' });
		core.value = r.coreSegment;
		core.readOnly = true;
		contentEl.createEl('p', { text: t('wizard.shell.note') });
		const shell = contentEl.createEl('textarea', { cls: 'fn-shell' });
		shell.value = r.narrativeShell;
		shell.addEventListener('input', () => { r.narrativeShell = shell.value; });

		contentEl.createEl('p', { text: t('wizard.links.note') });
		for (const k of this.kps) {
			new Setting(contentEl).setName(k.title).addText(tx => tx
				.setPlaceholder(t('wizard.link.placeholder'))
				.setValue(r.linkNotes[k.title] ?? '')
				.onChange(v => { r.linkNotes[k.title] = v; }));
		}

		this.statusEl = contentEl.createEl('p', { cls: 'fn-muted' });
		const actions = new Setting(contentEl);
		actions.addButton(b => b.setButtonText(t('wizard.back')).onClick(() => this.renderParams()));
		actions.addButton(b => b
			.setButtonText(t('wizard.write'))
			.setCta()
			.onClick(() => { void this.writeNote(); }));
	}

	private validate(): string | null {
		const st = this.plugin.settings;
		const r = this.result!;
		const words = countWords(r.coreSegment + r.narrativeShell);
		if (words < st.minWords) return t('wizard.validate.under', { words, min: st.minWords });
		if (words > st.maxWords) return t('wizard.validate.over', { words, max: st.maxWords });
		return null;
	}

	private async writeNote() {
		const err = this.validate();
		if (err) { new Notice(t('wizard.notice.validateFailed', { msg: err })); return; }
		const st = this.plugin.settings;
		const recipe = st.recipes[this.recipeIdx];
		try {
			const path = await writeComposedNote(
				this.app, st.outputDir, this.result!,
				{
					model: st.model,
					recipe: recipe.id,
					params: { ...this.slotValues },
					kpIds: this.kps.filter(k => !k.external && k.kpId > 0).map(k => k.kpId),
					linkNotes: this.result!.linkNotes,
				},
				this.kps,
			);
			new Notice(t('wizard.notice.written', { path }));
			this.close();
		} catch (e) {
			new Notice(t('wizard.notice.writeFailed', { msg: e instanceof Error ? e.message : String(e) }));
		}
	}
}
