/** 设置页三块：API / 配方管理（GUI CRUD，含槽位编辑）/ 使用说明 */
import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import type MimicPlugin from './main';
import type { MimicRecipe, RecipeSlot } from './types';

export class MimicSettingTab extends PluginSettingTab {
	private plugin: MimicPlugin;

	constructor(app: App, plugin: MimicPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		this.renderApi();
		this.renderRecipes();
		this.renderGuide();
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

	// ---------- ② 配方 CRUD ----------

	private renderRecipes() {
		const { containerEl } = this;
		containerEl.createEl('h2', { text: '拟态配方（模仿-扭曲的提示词参数集）' });
		const s = this.plugin.settings;

		s.recipes.forEach((r, i) => {
			new Setting(containerEl)
				.setName(r.name)
				.setDesc(`${r.id} · ${r.slots.length} 个槽位${r.worldview ? ` · 舞台：${r.worldview}` : ''}`)
				.addButton(b => b.setButtonText('编辑').onClick(() => {
					new RecipeEditModal(this.app, r, async () => { await this.plugin.saveSettings(); this.display(); }).open();
				}))
				.addButton(b => b.setButtonText('删除').onClick(async () => {
					s.recipes.splice(i, 1);
					await this.plugin.saveSettings();
					this.display();
				}));
		});

		new Setting(containerEl).addButton(b => b
			.setButtonText('＋ 新建配方')
			.setCta()
			.onClick(() => {
				const r: MimicRecipe = {
					id: `recipe_${Date.now()}`,
					name: '新配方',
					worldview: '',
					forbidden: ['不得编造事实与数据'],
					slots: [],
				};
				s.recipes.push(r);
				void this.plugin.saveSettings();
				new RecipeEditModal(this.app, r, async () => { await this.plugin.saveSettings(); this.display(); }).open();
			}));
	}

	// ---------- ③ 使用说明 ----------

	private renderGuide() {
		const el = this.containerEl.createEl('details');
		el.createEl('summary', { text: '如何配置一个配方（示例）' });
		const body = el.createDiv();
		body.innerHTML = `
<p><b>配方 = 舞台 + 禁则 + 槽位。</b>每个槽位是向导里的一个输入控件，并自带一段
prompt 模板（<code>{value}</code> 为用户填的值）。生成时各槽位片段按顺序拼进
【模仿-扭曲参数】区。</p>
<p>示例——"课堂讲授的保守教授"配方：</p>
<ul>
  <li>舞台：<code>无（留空即按现实语境写作）</code></li>
  <li>槽位1：模仿姿态（select）——模板 <code>以{value}的口吻复述知识</code>，可选：老教授 / 科普作家 / 播客主播</li>
  <li>槽位2：扭曲向量（text）——模板 <code>叙述倾向：{value}</code>，默认："着重强调考点，弱化争议"</li>
  <li>槽位3：扭曲强度（number 0~1）——模板 <code>口语化与戏剧化程度：{value}</code></li>
</ul>
<p>旧的"立场A/立场B"结构只是槽位的一种组装方式（见示范配方"产业博弈"）：
两个 text 槽位 + 一个倾斜方向 select。任何结构都由你自己组合，插件不加约束。</p>`;
	}
}

function newSlot(): RecipeSlot {
	return {
		id: `slot_${Date.now()}`,
		label: '新槽位',
		type: 'select',
		prompt: '{label}：{value}',
		values: ['选项1', '选项2'],
		deflt: '选项1',
	};
}

/** 配方编辑 Modal（舞台/禁则/槽位 CRUD） */
class RecipeEditModal extends Modal {
	private r: MimicRecipe;
	private onDone: () => Promise<void>;

	constructor(app: App, r: MimicRecipe, onDone: () => Promise<void>) {
		super(app);
		this.r = r;
		this.onDone = onDone;
		this.setTitle(`编辑配方：${r.name}`);
		this.modalEl.addClass('fn-wizard');
	}

	onOpen() {
		const { contentEl } = this;
		const r = this.r;

		new Setting(contentEl).setName('名称').addText(t => t.setValue(r.name).onChange(v => { r.name = v; }));
		new Setting(contentEl).setName('id').addText(t => t.setValue(r.id).onChange(v => { r.id = v.trim(); }));
		new Setting(contentEl).setName('舞台 / 世界观（可空）')
			.setDesc('虚构舞台（如"糖果国 vs 齿轮国"）；留空则按现实语境写作')
			.addTextArea(t => t.setValue(r.worldview).onChange(v => { r.worldview = v; }));
		new Setting(contentEl).setName('禁则（分号分隔）').addText(t => t.setValue(r.forbidden.join('；')).onChange(v => {
			r.forbidden = v.split(/[；;]/).map(x => x.trim()).filter(Boolean);
		}));

		contentEl.createEl('h3', { text: '提示词槽位（向导控件 + prompt 模板）' });
		r.slots.forEach((slot, i) => {
			const box = contentEl.createDiv({ cls: 'fn-subconflict' });
			const head = new Setting(box).setName(`#${i + 1} ${slot.label}（${slot.type}）`);
			head.addButton(b => b.setButtonText('删除').onClick(() => {
				r.slots.splice(i, 1);
				this.onOpen(); void this.onDone();
			}));
			new Setting(box).setName('槽位 id（进 frontmatter）').addText(t => t.setValue(slot.id).onChange(v => { slot.id = v.trim(); }));
			new Setting(box).setName('显示名').addText(t => t.setValue(slot.label).onChange(v => { slot.label = v; }));
			new Setting(box).setName('类型').addDropdown(dd => {
				dd.addOption('select', '单选');
				dd.addOption('number', '数值');
				dd.addOption('text', '自由文本');
				dd.setValue(slot.type).onChange(v => { slot.type = v as RecipeSlot['type']; });
			});
			new Setting(box).setName('prompt 模板（{value} 为用户值；{label} 为显示名）')
				.addText(t => t.setValue(slot.prompt ?? '').onChange(v => { slot.prompt = v; }));
			new Setting(box).setName('可选值（单选；逗号分隔）')
				.addText(t => t.setValue((slot.values ?? []).join(',')).onChange(v => {
					slot.values = v.split(/[,，]/).map(x => x.trim()).filter(Boolean);
				}));
			new Setting(box).setName('默认值').addText(t => t.setValue(slot.deflt ?? '').onChange(v => { slot.deflt = v; }));
			new Setting(box).setName('数值下限').addText(t => t.setValue(slot.min != null ? String(slot.min) : '').onChange(v => {
				if (v.trim() === '') { slot.min = undefined; return; }
				const n = parseFloat(v); if (Number.isFinite(n)) slot.min = n;
			}));
			new Setting(box).setName('数值上限').addText(t => t.setValue(slot.max != null ? String(slot.max) : '').onChange(v => {
				if (v.trim() === '') { slot.max = undefined; return; }
				const n = parseFloat(v); if (Number.isFinite(n)) slot.max = n;
			}));
		});
		new Setting(contentEl).addButton(b => b
			.setButtonText('＋ 槽位')
			.onClick(() => { r.slots.push(newSlot()); this.onOpen(); void this.onDone(); }));

		new Setting(contentEl).addButton(b => b
			.setButtonText('保存')
			.setCta()
			.onClick(async () => {
				if (!r.id || !r.name) {
					new Notice('id / 名称必填');
					return;
				}
				await this.onDone();
				this.close();
			}));
	}
}
