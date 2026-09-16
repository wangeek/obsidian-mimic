/** 加工向导：参数页（矛盾/立场/维度参数） → 生成定稿页（编辑+校验+落盘） */
import { App, Modal, Notice, Setting } from 'obsidian';
import type FakeNewsPlugin from './main';
import type { ComposeResult, ConflictGroup, KpNote } from './types';
import { buildGeneratePrompt } from './prompt';
import { chat, parseJsonLoose } from './llm';
import { writeComposedNote } from './render';

interface DimValue { [dimId: string]: string }

export class ComposeWizard extends Modal {
	private plugin: FakeNewsPlugin;
	private kps: KpNote[];
	private conflicts: ConflictGroup[];
	private conflictIdx = 0;
	private subIdx = 0;
	private dimValues: DimValue = {};
	private step = 0;

	private result: ComposeResult | null = null;
	private generating = false;
	private coreArea!: HTMLTextAreaElement;
	private shellArea!: HTMLTextAreaElement;
	private statusEl!: HTMLElement;

	constructor(app: App, plugin: FakeNewsPlugin, kps: KpNote[]) {
		super(app);
		this.plugin = plugin;
		this.kps = kps;
		this.conflicts = plugin.settings.conflicts;
		this.setTitle('Fake News · 加工向导');
		this.modalEl.addClass('fn-wizard');
	}

	onOpen() {
		for (const d of this.plugin.settings.dims) {
			this.dimValues[d.id] = d.deflt ?? (d.type === 'number' ? '1200' : d.values?.[0] ?? '');
		}
		this.renderParams();
	}

	// ---------- 第 1 页：参数 ----------

	private renderParams() {
		this.step = 0;
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('p', {
			cls: 'fn-muted',
			text: `素材：${this.kps.map(k => k.title).join('、')}`,
		});

		const c = this.conflicts[this.conflictIdx];
		const sub = c?.sub_conflicts[this.subIdx];

		new Setting(contentEl).setName('矛盾组').addDropdown(dd => {
			this.conflicts.forEach((g, i) => dd.addOption(String(i), g.name));
			dd.setValue(String(this.conflictIdx)).onChange(v => {
				this.conflictIdx = parseInt(v, 10); this.subIdx = 0; this.renderParams();
			});
		});
		new Setting(contentEl).setName('子矛盾').addDropdown(dd => {
			(c?.sub_conflicts ?? []).forEach((s, i) =>
				dd.addOption(String(i), `${s.stance_a.name} vs ${s.stance_b.name}`));
			dd.setValue(String(this.subIdx)).onChange(v => {
				this.subIdx = parseInt(v, 10); this.renderParams();
			});
		});
		if (sub) {
			contentEl.createEl('p', {
				cls: 'fn-stance-info',
				text: `A：${sub.stance_a.name}——${sub.stance_a.core_claim}\nB：${sub.stance_b.name}——${sub.stance_b.core_claim}`,
			});
		}

		// 维度参数（schema 驱动动态渲染——新维度只改配置）
		for (const d of this.plugin.settings.dims) {
			const s = new Setting(contentEl).setName(d.label);
			if (d.type === 'select') {
				s.addDropdown(dd => {
					(d.values ?? []).forEach(v => dd.addOption(v, v));
					dd.setValue(this.dimValues[d.id]).onChange(v => { this.dimValues[d.id] = v; });
				});
			} else {
				s.addText(t => t
					.setValue(this.dimValues[d.id])
					.onChange(v => { this.dimValues[d.id] = v; }));
				if (d.min != null || d.max != null) {
					s.setClass?.('fn-dim-num');
				}
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
		const c = this.conflicts[this.conflictIdx];
		const sub = c.sub_conflicts[this.subIdx];
		if (!sub) { new Notice('该矛盾组没有子矛盾'); this.generating = false; return; }

		const paramsLine = st.dims
			.map(d => `${d.label}：${this.dimValues[d.id] ?? ''}`)
			.join('；');
		const points = await Promise.all(this.kps.map(async k => ({
			title: k.title,
			coreDefinition: k.definition || await this.plugin.readKpContent(k.path).then(t => t.slice(0, 500)),
			keyPoints: `第${k.chapter}章 ${k.chapterTitle}${k.section ? ' ' + k.section : ''}`,
		})));

		const { system, user } = buildGeneratePrompt({
			worldview: c.worldview,
			conflictName: `${c.name} / ${sub.id}`,
			baseConflict: String(sub.base_conflict),
			stanceAName: sub.stance_a.name,
			stanceAClaim: sub.stance_a.core_claim,
			stanceBName: sub.stance_b.name,
			stanceBClaim: sub.stance_b.core_claim,
			paramsLine,
			points,
			relatedTitles: this.kps.map(k => k.title).join('、'),
			forbidden: c.forbidden.join('；') || '不编造数据，不映射现实国家',
		});

		this.renderGenerating();
		try {
			const raw = await chat(st, system, user, 0.7);
			const v = parseJsonLoose(raw);
			const r: ComposeResult = {
				title: String(v.title ?? ''),
				coreSegment: String(v.core_segment ?? ''),
				narrativeShell: String(v.narrative_shell ?? ''),
			};
			if (!r.title || !r.coreSegment || !r.narrativeShell) {
				throw new Error('回复缺少 title / core_segment / narrative_shell');
			}
			this.result = r;
			this.renderResult();
		} catch (e) {
			this.statusEl.setText(`生成失败：${e instanceof Error ? e.message : String(e)}（可返回参数页重试）`);
			this.contentEl.createEl('br');
			const back = new Setting(this.contentEl);
			back.addButton(b => b.setButtonText('← 返回参数页').onClick(() => this.renderParams()));
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
		this.step = 1;
		const { contentEl } = this;
		contentEl.empty();
		const r = this.result!;

		new Setting(contentEl).setName('标题').addText(t => t.setValue(r.title).onChange(v => { r.title = v; }));
		contentEl.createEl('p', { text: '核心段（知识密度最高，不再编辑）' });
		this.coreArea = contentEl.createEl('textarea', { cls: 'fn-core' });
		this.coreArea.value = r.coreSegment;
		this.coreArea.readOnly = true;
		contentEl.createEl('p', { text: '叙事外壳（可编辑定稿）' });
		this.shellArea = contentEl.createEl('textarea', { cls: 'fn-shell' });
		this.shellArea.value = r.narrativeShell;

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
		const c = st.conflicts[this.conflictIdx];
		const sub = c.sub_conflicts[this.subIdx];
		try {
			const path = await writeComposedNote(
				this.app, st.outputDir, this.result!,
				{
					model: st.model,
					conflict: `${c.id}/${sub.id}`,
					params: { ...this.dimValues },
					kpIds: this.kps.map(k => k.kpId),
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
