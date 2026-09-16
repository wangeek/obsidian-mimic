/** 素材选择器：搜索 + 复选多选知识点笔记；也可一键改用当前打开的笔记 */
import { App, ButtonComponent, Modal, Setting } from 'obsidian';
import type { KpNote } from './types';

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
		this.setTitle('Mimic · 选择加工素材');
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
				.setName('当前笔记')
				.setDesc('不想从目录里挑？直接拿正在编辑的这篇当素材（不受知识点目录限制）')
				.addButton(b => b
					.setButtonText(`用「${this.current!.title}」作素材`)
					.onClick(() => {
						this.resolveOnce([this.current!]);
						this.close();
					}));
		}
		new Setting(contentEl)
			.setName('从知识点目录勾选')
			.addText(t => t
				.setPlaceholder('搜索：标题 / 章节 / 编号')
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
			? `下一步：设置参数（已选 ${this.selected.size}）`
			: '下一步：设置参数');
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
