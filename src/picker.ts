/** 素材选择器：搜索 + 复选多选知识点笔记 */
import { App, Modal, Setting, TFile } from 'obsidian';
import type { KpNote } from './types';

export class KpPickerModal extends Modal {
	private query = '';
	private selected = new Set<string>(); // path 去重
	private listEl!: HTMLElement;
	private okBtn!: HTMLElement;
	private resolveFn!: (picked: KpNote[]) => void;
	private all: KpNote[];

	constructor(app: App, notes: KpNote[]) {
		super(app);
		this.all = notes;
		this.setTitle('Fake News · 选择加工素材（知识点）');
	}

	/** 返回 Promise，resolve 选中的知识点（取消返回 []） */
	openAndWait(): Promise<KpNote[]> {
		return new Promise(resolve => { this.resolveFn = resolve; this.open(); });
	}

	onOpen() {
		const { contentEl } = this;
		new Setting(contentEl)
			.setName('搜索')
			.addText(t => t
				.setPlaceholder('标题 / 章节 / 编号')
				.onChange(v => { this.query = v.trim(); this.renderList(); }));
		this.listEl = contentEl.createDiv({ cls: 'fn-picker-list' });
		new Setting(contentEl)
			.addButton(b => b
				.setButtonText('下一步：设置参数')
				.setCta()
				.onClick(() => {
					const picked = this.all.filter(n => this.selected.has(n.path));
					this.close();
					this.resolveFn(picked);
				}));
		contentEl.addEventListener('keydown', e => {
			if (e.key === 'Escape') { this.resolveFn([]); }
		});
		this.renderList();
	}

	private renderList() {
		this.listEl.empty();
		const q = this.query.toLowerCase();
		const hits = (q ? this.all.filter(n =>
			n.title.toLowerCase().includes(q) ||
			n.chapterTitle.toLowerCase().includes(q) ||
			String(n.kpId) === q ||
			(n.section || '').toLowerCase().includes(q)) : this.all).slice(0, 200);
		for (const n of hits) {
			const row = this.listEl.createDiv({ cls: 'fn-picker-row' });
			const cb = row.createEl('input', { type: 'checkbox' });
			cb.checked = this.selected.has(n.path);
			cb.addEventListener('change', () => {
				if (cb.checked) this.selected.add(n.path);
				else this.selected.delete(n.path);
				row.toggleClass('is-selected', cb.checked);
			});
			row.createSpan({ text: `${n.kpId} · ${n.title}` });
			row.createSpan({ cls: 'fn-picker-meta', text: `第${n.chapter}章 ${n.chapterTitle}` });
			row.addEventListener('click', (e) => {
				if (e.target === cb) return;
				cb.checked = !cb.checked;
				cb.dispatchEvent(new Event('change'));
			});
			row.toggleClass('is-selected', cb.checked);
		}
		if (!hits.length) {
			this.listEl.createDiv({ cls: 'fn-picker-empty', text: '（无匹配知识点；确认知识点目录设置正确且已迁移）' });
		}
	}
}
