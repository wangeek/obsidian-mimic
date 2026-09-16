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
		el.createEl('summary', { text: '配方怎么用（大白话 + 工作原理）' });
		const body = el.createDiv();
		body.innerHTML = `
<p><b>配方就是一张"写作任务单"：</b>告诉 AI <b>在哪个世界讲故事（舞台）、什么不许干（禁则）、
按哪几句话来写（槽位）</b>。</p>
<p><b>工作原理（prompt 注入，一句话版）：</b>点"生成"时，插件把你的配置拼成一段指令发给大模型——</p>
<ul>
  <li>【世界观】← 舞台（故事发生在哪儿）</li>
  <li>【模仿-扭曲参数】← 每个槽位一行：槽位的句子模板 + 你填的值</li>
  <li>【知识素材】← 你勾选的笔记原文</li>
  <li>【禁则】← 红线清单</li>
</ul>
<p>模型只看这段拼出来的字。所以：<b>插件本身不懂内容，只负责拼装</b>——槽位随便加、随便改，
写得越具体，文章走向越可控；一切结构都由你组合。</p>
<p><b>看内置的"西游新传"配方就懂了：</b>舞台是取经路；"谁来讲解"选孙悟空，AI 就用猴哥的口气讲；
"难点变妖怪"填"概念迷雾妖"，最难懂的知识点就变成一场要降的妖；"发挥程度"从 0（照书正经讲）
拉到 1（天马行空），但禁则保证核心定义永远讲对——<b>这就是"模仿"（知识不许错）×"扭曲"
（说法放开变）</b>。</p>
<p>想自己搭：新建配方 → 加槽位。比如槽位"模仿姿态"（单选），句子填
<code>以{value}的口吻复述知识</code>，选项写 老教授 / 科普主播 / 相声演员，就能一键换讲法。</p>`;
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
		new Setting(contentEl).setName('id（配方的英文代号，进产物记录）').addText(t => t.setValue(r.id).onChange(v => { r.id = v.trim(); }));
		new Setting(contentEl).setName('舞台：故事发生在哪个世界？（可空）')
			.setDesc('例："西游取经世界"。留空 = 按现实语境正经写')
			.addTextArea(t => t.setValue(r.worldview).onChange(v => { r.worldview = v; }));
		new Setting(contentEl).setName('禁则：什么是红线？（分号分隔）')
			.setDesc('例：不编造数据；核心定义必须讲对')
			.addText(t => t.setValue(r.forbidden.join('；')).onChange(v => {
				r.forbidden = v.split(/[；;]/).map(x => x.trim()).filter(Boolean);
			}));

		contentEl.createEl('h3', { text: '槽位（向导里的输入框；每个槽位 = 一句拼进指令的话 + 你填的值）' });
		r.slots.forEach((slot, i) => {
			const box = contentEl.createDiv({ cls: 'fn-subconflict' });
			const head = new Setting(box).setName(`#${i + 1} ${slot.label}（${slot.type}）`);
			head.addButton(b => b.setButtonText('删除').onClick(() => {
				r.slots.splice(i, 1);
				this.onOpen(); void this.onDone();
			}));
			const rowA = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowA).setName('槽位 id（英文代号，进产物记录）').addText(t => t.setValue(slot.id).onChange(v => { slot.id = v.trim(); }));
			new Setting(rowA).setName('显示名（向导里展示的名字）').addText(t => t.setValue(slot.label).onChange(v => { slot.label = v; }));
			const rowB = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowB).setName('输入方式').addDropdown(dd => {
				dd.addOption('select', '下拉单选');
				dd.addOption('number', '数字');
				dd.addOption('text', '自由文本');
				dd.setValue(slot.type).onChange(v => { slot.type = v as RecipeSlot['type']; });
			});
			new Setting(rowB).setName('默认值').addText(t => t.setValue(slot.deflt ?? '').onChange(v => { slot.deflt = v; }));
			new Setting(box).setName('拼进指令的句子（{value}=用户填的值，{label}=显示名）')
				.setDesc('生成时这行字会连同用户填写的值一起发给 AI。例：以{value}的口吻复述知识')
				.addText(t => t.setValue(slot.prompt ?? '').onChange(v => { slot.prompt = v; }));
			new Setting(box).setName('下拉选项（仅"下拉单选"；逗号分隔）')
				.addText(t => t.setValue((slot.values ?? []).join(',')).onChange(v => {
					slot.values = v.split(/[,，]/).map(x => x.trim()).filter(Boolean);
				}));
			const rowC = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowC).setName('数字最小值（可空）').addText(t => t.setValue(slot.min != null ? String(slot.min) : '').onChange(v => {
				if (v.trim() === '') { slot.min = undefined; return; }
				const n = parseFloat(v); if (Number.isFinite(n)) slot.min = n;
			}));
			new Setting(rowC).setName('数字最大值（可空）').addText(t => t.setValue(slot.max != null ? String(slot.max) : '').onChange(v => {
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
