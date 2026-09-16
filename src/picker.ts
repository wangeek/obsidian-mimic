/** 素材选择器：搜索 + 复选多选知识点笔记；也可一键改用当前打开的笔记 */
import { App, ButtonComponent, Modal, Setting } from 'obsidian';
import type { KpNote } from './types';
import { t } from './i18n';

export class KpPickerModal extends Modal {
	private query = '';
	private selected = new Set<string>(); // path 去重
	private listEl!: HTMLElement;
	private okBtn!: ButtonComponent;
	private resolveFn!: (picked: KpNote[]) => void;
	private resolved = false;
	private all: KpNote[];
	private current: KpNote | null;

	constructor(app: App, notes: KpNote[], current: KpNote | null = null) {
		super(app);
		this.all = notes;
		this.current = current;
		this.setTitle(t('picker.title'));
	}

	/** 返回 Promise，resolve 选中的知识点（取消/关闭返回 []） */
	openAndWait(): Promise<KpNote[]> {
		return new Promise(resolve => { this.resolveFn = resolve; this.open(); });
	}

	/** 只 resolve 一次：确认/Escape/点 X 关闭都收敛到这里 */
	private resolveOnce(picked: KpNote[]) {
		if (this.resolved) return;
		this.resolved = true;
		this.resolveFn(picked);
	}

	onClose() {
		this.resolveOnce([]);
	}

	onOpen() {
		const { contentEl } = this;
		if (this.current) {
			new Setting(contentEl)
				.setName(t('picker.current.name'))
				.setDesc(t('picker.current.desc'))
				.addButton(b => b
					.setButtonText(t('picker.current.button', { title: this.current!.title }))
					.onClick(() => {
						this.resolveOnce([this.current!]);
						this.close();
					}));
		}
		new Setting(contentEl)
			.setName(t('picker.folder.name'))
			.addText(t2 => t2
				.setPlaceholder(t('picker.search.placeholder'))
				.onChange(v => { this.query = v.trim(); this.renderList(); }));
		this.listEl = contentEl.createDiv({ cls: 'fn-picker-list' });
		new Setting(contentEl)
			.addButton(b => {
				this.okBtn = b;
				b.setCta()
					.onClick(() => {
						const picked = this.all.filter(n => this.selected.has(n.path));
						this.resolveOnce(picked);
						this.close();
					});
			});
		this.updateOkBtn();
		this.renderList();
	}

	private updateOkBtn() {
		this.okBtn?.setButtonText(this.selected.size
			? t('picker.next.count', { count: this.selected.size })
			: t('picker.next.empty'));
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
				this.updateOkBtn();
			});
			row.createSpan({ text: `${n.kpId} · ${n.title}` });
			row.createSpan({ cls: 'fn-picker-meta', text: n.chapter ? t('picker.row.meta', { chapter: n.chapter, chapterTitle: n.chapterTitle }) : '' });
			row.addEventListener('click', (e) => {
				if (e.target === cb) return;
				cb.checked = !cb.checked;
				cb.dispatchEvent(new Event('change'));
			});
			row.toggleClass('is-selected', cb.checked);
		}
		if (!hits.length) {
			this.listEl.createDiv({ cls: 'fn-picker-empty', text: t('picker.empty') });
		}
	}
}
