/** 拟态向导：配方+槽位参数页 → 生成定稿页（编辑+校验+落盘） */
import { App, Modal, Notice, Setting } from 'obsidian';
import type MimicPlugin from './main';
import type { ComposeResult, KpNote } from './types';
import { buildGeneratePrompt, renderSlot } from './prompt';
import { chat, parseJsonLoose } from './llm';
import { writeComposedNote } from './render';

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
		this.setTitle('Mimic · 拟态加工');
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
		contentEl.createEl('p', {
			cls: 'fn-muted',
			text: `素材：${this.kps.map(k => k.title).join('、')}`,
		});

		const recipes = this.plugin.settings.recipes;
		new Setting(contentEl).setName('配方').addDropdown(dd => {
			recipes.forEach((r, i) => dd.addOption(String(i), r.name));
			dd.setValue(String(this.recipeIdx)).onChange(v => {
				this.recipeIdx = parseInt(v, 10);
				this.resetSlotDefaults(this.recipeIdx);
				this.renderParams();
			});
		});

		const r = recipes[this.recipeIdx];
		if (r?.worldview) {
			contentEl.createEl('p', { cls: 'fn-stance-info', text: `舞台：${r.worldview}` });
		}

		// 槽位渲染（配方驱动；select/number/text 三种控件）
		for (const s of r?.slots ?? []) {
			const set = new Setting(contentEl).setName(s.label);
			if (s.type === 'select') {
				set.addDropdown(dd => {
					(s.values ?? []).forEach(v => dd.addOption(v, v));
					dd.setValue(this.slotValues[s.id] ?? '').onChange(v => { this.slotValues[s.id] = v; });
				});
			} else if (s.type === 'number') {
				set.addText(t => {
					t.inputEl.type = 'number';
					if (s.min != null) t.inputEl.min = String(s.min);
					if (s.max != null) t.inputEl.max = String(s.max);
					t.setValue(this.slotValues[s.id] ?? '')
						.onChange(v => { this.slotValues[s.id] = v; });
				});
			} else {
				set.addTextArea(t => t
					.setValue(this.slotValues[s.id] ?? '')
					.onChange(v => { this.slotValues[s.id] = v; }));
			}
		}

		new Setting(contentEl).addButton(b => b
			.setButtonText('生成')
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

		// 素材：正文小节（核心定义/关键要点）优先，frontmatter/开头摘录兜底
		const points = await Promise.all(this.kps.map(async k => {
			const sec = await this.plugin.readKpSections(k.path);
			return {
				title: k.title,
				coreDefinition: k.definition || sec.coreDefinition || sec.excerpt,
				keyPoints: [
					sec.keyPoints,
					`第${k.chapter}章 ${k.chapterTitle}${k.section ? ' ' + k.section : ''}`,
				].filter(Boolean).join('\n'),
			};
		}));

		const { system, user } = buildGeneratePrompt({
			worldview: r.worldview,
			paramsLines,
			points,
			relatedTitles: this.kps.map(k => k.title).join('、'),
			forbidden: r.forbidden.join('；') || '不得编造事实与数据',
		});

		this.renderGenerating();
		try {
			const raw = await chat(st, system, user, 0.7);
			const v = parseJsonLoose(raw);
			const linkNotes: Record<string, string> = {};
			const ln = v.link_notes;
			if (ln && typeof ln === 'object' && !Array.isArray(ln)) {
				for (const [t, note] of Object.entries(ln as Record<string, unknown>)) {
					linkNotes[t.trim()] = String(note ?? '').trim();
				}
			}
			const res: ComposeResult = {
				title: String(v.title ?? ''),
				coreSegment: String(v.core_segment ?? ''),
				narrativeShell: String(v.narrative_shell ?? ''),
				linkNotes,
			};
			if (!res.title || !res.coreSegment || !res.narrativeShell) {
				throw new Error('回复缺少 title / core_segment / narrative_shell');
			}
			this.result = res;
			this.renderResult();
		} catch (e) {
			this.statusEl.setText(`生成失败：${e instanceof Error ? e.message : String(e)}（可返回参数页重试）`);
			new Setting(this.contentEl).addButton(b => b
				.setButtonText('← 返回参数页')
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
			text: `生成中（${this.plugin.settings.model}，约 0.5~1 分钟）…`,
		});
	}

	// ---------- 第 2 页：定稿 ----------

	private renderResult() {
		const { contentEl } = this;
		contentEl.empty();
		const r = this.result!;

		new Setting(contentEl).setName('标题').addText(t => t.setValue(r.title).onChange(v => { r.title = v; }));
		contentEl.createEl('p', { text: '核心段（模仿底线：知识密度最高，不再编辑）' });
		const core = contentEl.createEl('textarea', { cls: 'fn-core' });
		core.value = r.coreSegment;
		core.readOnly = true;
		contentEl.createEl('p', { text: '叙事外壳（扭曲层，可编辑定稿）' });
		const shell = contentEl.createEl('textarea', { cls: 'fn-shell' });
		shell.value = r.narrativeShell;
		shell.addEventListener('input', () => { r.narrativeShell = shell.value; });

		contentEl.createEl('p', { text: '关联知识点说明（写进文尾链接；留空则只注章节）' });
		for (const k of this.kps) {
			new Setting(contentEl).setName(k.title).addText(t => t
				.setPlaceholder('一句话：本文如何使用它')
				.setValue(r.linkNotes[k.title] ?? '')
				.onChange(v => { r.linkNotes[k.title] = v; }));
		}

		this.statusEl = contentEl.createEl('p', { cls: 'fn-muted' });
		const actions = new Setting(contentEl);
		actions.addButton(b => b.setButtonText('← 参数').onClick(() => this.renderParams()));
		actions.addButton(b => b
			.setButtonText('写入笔记')
			.setCta()
			.onClick(() => { void this.writeNote(); }));
	}

	private validate(): string | null {
		const st = this.plugin.settings;
		const r = this.result!;
		const words = (r.coreSegment + r.narrativeShell).replace(/\s/g, '').length;
		if (words < st.minWords) return `字数不足（${words} < ${st.minWords}）`;
		if (words > st.maxWords) return `字数超出（${words} > ${st.maxWords}）`;
		return null;
	}

	private async writeNote() {
		const err = this.validate();
		if (err) { new Notice(`校验未通过：${err}`); return; }
		const st = this.plugin.settings;
		const recipe = st.recipes[this.recipeIdx];
		try {
			const path = await writeComposedNote(
				this.app, st.outputDir, this.result!,
				{
					model: st.model,
					recipe: recipe.id,
					params: { ...this.slotValues },
					kpIds: this.kps.map(k => k.kpId),
					linkNotes: this.result!.linkNotes,
				},
				this.kps,
			);
			new Notice(`已写入：${path}`);
			this.close();
		} catch (e) {
			new Notice(`写入失败：${e instanceof Error ? e.message : String(e)}`);
		}
	}
}
