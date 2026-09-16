/** 设置页三块：API / 矛盾组管理（GUI CRUD）/ 参数维度预设（GUI 增删） */
import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import type FakeNewsPlugin from './main';
import type { ConflictGroup, SubConflict } from './types';

export class FakeNewsSettingTab extends PluginSettingTab {
	private plugin: FakeNewsPlugin;

	constructor(app: App, plugin: FakeNewsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		this.renderApi();
		this.renderConflicts();
		this.renderDims();
	}

	// ---------- ① API ----------

	private renderApi() {
		const { containerEl } = this;
		containerEl.createEl('h2', { text: 'API' });
		const s = this.plugin.settings;

		new Setting(containerEl).setName('API Key（MiniMax 国内平台）')
			.addText(t => t.setValue(s.apiKey).onChange(async v => { s.apiKey = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Base URL')
			.addText(t => t.setValue(s.baseUrl).onChange(async v => { s.baseUrl = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('模型')
			.addText(t => t.setValue(s.model).onChange(async v => { s.model = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('知识点目录（vault 相对）')
			.addText(t => t.setValue(s.knowledgeDir).onChange(async v => { s.knowledgeDir = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('输出目录（vault 相对）')
			.addText(t => t.setValue(s.outputDir).onChange(async v => { s.outputDir = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('字数下限').addText(t => t
			.setValue(String(s.minWords))
			.onChange(async v => { const n = parseInt(v, 10); if (Number.isFinite(n)) { s.minWords = n; await this.plugin.saveSettings(); } }));
		new Setting(containerEl).setName('字数上限').addText(t => t
			.setValue(String(s.maxWords))
			.onChange(async v => { const n = parseInt(v, 10); if (Number.isFinite(n)) { s.maxWords = n; await this.plugin.saveSettings(); } }));
	}

	// ---------- ② 矛盾组 CRUD ----------

	private renderConflicts() {
		const { containerEl } = this;
		containerEl.createEl('h2', { text: '矛盾组（加工的拟态冲突内容）' });
		const s = this.plugin.settings;

		s.conflicts.forEach((g, i) => {
			new Setting(containerEl)
				.setName(g.name)
				.setDesc(`${g.id} · ${g.sub_conflicts.length} 个子矛盾`)
				.addButton(b => b.setButtonText('编辑').onClick(() => {
					new ConflictEditModal(this.app, g, async () => { await this.plugin.saveSettings(); this.display(); }).open();
				}))
				.addButton(b => b.setButtonText('删除').onClick(async () => {
					s.conflicts.splice(i, 1);
					await this.plugin.saveSettings();
					this.display();
				}));
		});

		new Setting(containerEl).addButton(b => b
			.setButtonText('＋ 新建矛盾组')
			.setCta()
			.onClick(() => {
				const g: ConflictGroup = {
					id: `custom_${Date.now()}`,
					name: '新矛盾组',
					worldview: 'A国 vs B国（自行设定虚构世界观）',
					forbidden: ['不映射现实国家', '不编造数据'],
					sub_conflicts: [newSubConflict()],
				};
				s.conflicts.push(g);
				void this.plugin.saveSettings();
				new ConflictEditModal(this.app, g, async () => { await this.plugin.saveSettings(); this.display(); }).open();
			}));
	}

	// ---------- ③ 维度预设 ----------

	private renderDims() {
		const { containerEl } = this;
		containerEl.createEl('h2', { text: '参数维度（向导页动态渲染）' });
		const s = this.plugin.settings;

		s.dims.forEach((d, i) => {
			const set = new Setting(containerEl)
				.setName(`${d.label}（${d.id}）`)
				.setDesc(d.type === 'select' ? (d.values ?? []).join(' / ') : `数值 ${d.min ?? '?'}~${d.max ?? '?'}`);
			set.addButton(b => b.setButtonText('编辑').onClick(() => {
				new DimEditModal(this.app, d, async () => { await this.plugin.saveSettings(); this.display(); }).open();
			}));
			set.addButton(b => b.setButtonText('删除').onClick(async () => {
				s.dims.splice(i, 1);
				await this.plugin.saveSettings();
				this.display();
			}));
		});

		new Setting(containerEl).addButton(b => b
			.setButtonText('＋ 新维度')
			.setCta()
			.onClick(() => {
				s.dims.push({ id: `dim_${Date.now()}`, label: '新维度', type: 'select', values: ['选项1', '选项2'], deflt: '选项1' });
				void this.plugin.saveSettings();
				this.display();
			}));

		containerEl.createEl('p', {
			cls: 'setting-item-description',
			text: '维度只是注入 prompt 的数据：新增自定义维度（如"受众视角"）无需改代码，向导与产物 frontmatter 自动携带。',
		});
	}
}

function newSubConflict(): SubConflict {
	return {
		id: `sub_${Date.now()}`,
		stance_a: { name: '立场A', core_claim: 'A 方的核心主张', keywords: [] },
		stance_b: { name: '立场B', core_claim: 'B 方的核心主张', keywords: [] },
		base_conflict: 0.8,
	};
}

/** 矛盾组编辑 Modal（世界观/禁忌/子矛盾 CRUD/立场字段） */
class ConflictEditModal extends Modal {
	private g: ConflictGroup;
	private onDone: () => Promise<void>;

	constructor(app: App, g: ConflictGroup, onDone: () => Promise<void>) {
		super(app);
		this.g = g;
		this.onDone = onDone;
		this.setTitle(`编辑矛盾组：${g.name}`);
		this.modalEl.addClass('fn-wizard');
	}

	onOpen() {
		const { contentEl } = this;
		const g = this.g;

		new Setting(contentEl).setName('名称').addText(t => t.setValue(g.name).onChange(v => { g.name = v; }));
		new Setting(contentEl).setName('id').addText(t => t.setValue(g.id).onChange(v => { g.id = v.trim(); }));
		new Setting(contentEl).setName('世界观').addTextArea(t => t.setValue(g.worldview).onChange(v => { g.worldview = v; }));
		new Setting(contentEl).setName('禁忌（分号分隔）').addText(t => t.setValue(g.forbidden.join('；')).onChange(v => {
			g.forbidden = v.split(/[；;]/).map(x => x.trim()).filter(Boolean);
		}));

		contentEl.createEl('h3', { text: '子矛盾' });
		g.sub_conflicts.forEach((sub, i) => {
			const box = contentEl.createDiv({ cls: 'fn-subconflict' });
			const head = new Setting(box).setName(`#${i + 1} ${sub.stance_a.name} vs ${sub.stance_b.name}`);
			head.addButton(b => b.setButtonText('删除').onClick(() => {
				g.sub_conflicts.splice(i, 1);
				this.onOpen(); void this.onDone();
			}));
			new Setting(box).setName('子矛盾 id').addText(t => t.setValue(sub.id).onChange(v => { sub.id = v.trim(); }));
			new Setting(box).setName('基础冲突度（0~1）').addText(t => t
				.setValue(String(sub.base_conflict))
				.onChange(v => { const n = parseFloat(v); if (Number.isFinite(n)) sub.base_conflict = n; }));
			this.stanceEditor(box, sub, 'a');
			this.stanceEditor(box, sub, 'b');
		});
		new Setting(contentEl).addButton(b => b
			.setButtonText('＋ 子矛盾')
			.onClick(() => { g.sub_conflicts.push(newSubConflict()); this.onOpen(); void this.onDone(); }));

		new Setting(contentEl).addButton(b => b
			.setButtonText('保存')
			.setCta()
			.onClick(async () => {
				if (!g.id || !g.name || !g.sub_conflicts.length) {
					new Notice('id / 名称 / 至少一个子矛盾必填');
					return;
				}
				await this.onDone();
				this.close();
			}));
	}

	private stanceEditor(container: HTMLElement, sub: SubConflict, side: 'a' | 'b') {
		const key = side === 'a' ? 'stance_a' : 'stance_b';
		const st = sub[key];
		new Setting(container).setName(`立场${side.toUpperCase()} 名称`).addText(t => t.setValue(st.name).onChange(v => { st.name = v; }));
		new Setting(container).setName(`立场${side.toUpperCase()} 核心主张`).addTextArea(t => t.setValue(st.core_claim).onChange(v => { st.core_claim = v; }));
		new Setting(container).setName(`立场${side.toUpperCase()} 关键词（逗号分隔）`)
			.addText(t => t.setValue(st.keywords.join(',')).onChange(v => {
				st.keywords = v.split(/[,，]/).map(x => x.trim()).filter(Boolean);
			}));
	}
}

/** 维度编辑 Modal */
class DimEditModal extends Modal {
	private d: import('./types').ParamDim;
	private onDone: () => Promise<void>;

	constructor(app: App, d: import('./types').ParamDim, onDone: () => Promise<void>) {
		super(app);
		this.d = d;
		this.onDone = onDone;
		this.setTitle(`编辑维度：${d.label}`);
	}

	onOpen() {
		const { contentEl } = this;
		const d = this.d;
		new Setting(contentEl).setName('id（进 frontmatter 的键名）').addText(t => t.setValue(d.id).onChange(v => { d.id = v.trim(); }));
		new Setting(contentEl).setName('显示名').addText(t => t.setValue(d.label).onChange(v => { d.label = v; }));
		new Setting(contentEl).setName('类型').addDropdown(dd => {
			dd.addOption('select', '单选');
			dd.addOption('number', '数值');
			dd.setValue(d.type).onChange(v => { d.type = v as 'select' | 'number'; });
		});
		new Setting(contentEl).setName('可选值（单选；逗号分隔）')
			.addText(t => t.setValue((d.values ?? []).join(',')).onChange(v => {
				d.values = v.split(/[,，]/).map(x => x.trim()).filter(Boolean);
			}));
		new Setting(contentEl).setName('默认值').addText(t => t.setValue(d.deflt ?? '').onChange(v => { d.deflt = v; }));
		new Setting(contentEl).setName('数值下限').addText(t => t.setValue(d.min != null ? String(d.min) : '').onChange(v => { const n = parseFloat(v); if (Number.isFinite(n)) d.min = n; }));
		new Setting(contentEl).setName('数值上限').addText(t => t.setValue(d.max != null ? String(d.max) : '').onChange(v => { const n = parseFloat(v); if (Number.isFinite(n)) d.max = n; }));
		new Setting(contentEl).addButton(b => b
			.setButtonText('保存')
			.setCta()
			.onClick(async () => {
				if (!d.id || !d.label) { new Notice('id / 显示名必填'); return; }
				await this.onDone();
				this.close();
			}));
	}
}
