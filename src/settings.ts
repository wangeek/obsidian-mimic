/** 设置页三块：API / 配方管理（GUI CRUD，含槽位编辑）/ 使用说明 */
import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import type MimicPlugin from './main';
import type { MimicRecipe, RecipeSlot } from './types';
import { t } from './i18n';

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
		containerEl.createEl('h2', { text: t('settings.api.heading') });
		const s = this.plugin.settings;

		new Setting(containerEl).setName(t('settings.api.key'))
			.addText(tx => tx.setValue(s.apiKey).onChange(async v => { s.apiKey = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName(t('settings.api.baseUrl'))
			.addText(tx => tx.setValue(s.baseUrl).onChange(async v => { s.baseUrl = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName(t('settings.api.model'))
			.addText(tx => tx.setValue(s.model).onChange(async v => { s.model = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName(t('settings.api.knowledgeDir'))
			.addText(tx => tx.setValue(s.knowledgeDir).onChange(async v => { s.knowledgeDir = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName(t('settings.api.outputDir'))
			.addText(tx => tx.setValue(s.outputDir).onChange(async v => { s.outputDir = v.trim(); await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName(t('settings.api.minWords')).addText(tx => tx
			.setValue(String(s.minWords))
			.onChange(async v => { const n = parseInt(v, 10); if (Number.isFinite(n)) { s.minWords = n; await this.plugin.saveSettings(); } }));
		new Setting(containerEl).setName(t('settings.api.maxWords')).addText(tx => tx
			.setValue(String(s.maxWords))
			.onChange(async v => { const n = parseInt(v, 10); if (Number.isFinite(n)) { s.maxWords = n; await this.plugin.saveSettings(); } }));
	}

	// ---------- ② 配方 CRUD ----------

	private renderRecipes() {
		const { containerEl } = this;
		containerEl.createEl('h2', { text: t('settings.recipes.heading') });
		const s = this.plugin.settings;

		s.recipes.forEach((r, i) => {
			const desc = [t('settings.recipes.slotCount', { count: r.slots.length }),
				r.worldview ? t('settings.recipes.stage', { stage: r.worldview }) : '']
				.filter(Boolean).join(' · ');
			new Setting(containerEl)
				.setName(r.name)
				.setDesc(`${r.id} · ${desc}`)
				.addButton(b => b.setButtonText(t('settings.recipes.edit')).onClick(() => {
					new RecipeEditModal(this.app, r, async () => { await this.plugin.saveSettings(); this.display(); }).open();
				}))
				.addButton(b => b.setButtonText(t('settings.recipes.delete')).onClick(async () => {
					s.recipes.splice(i, 1);
					await this.plugin.saveSettings();
					this.display();
				}));
		});

		new Setting(containerEl).addButton(b => b
			.setButtonText(t('settings.recipes.new'))
			.setCta()
			.onClick(() => {
				const r: MimicRecipe = {
					id: `recipe_${Date.now()}`,
					name: t('settings.recipes.new').replace('＋ ', ''),
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
		el.createEl('summary', { text: t('settings.guide.summary') });
		el.createDiv().innerHTML = t('settings.guide.html');
	}
}

function newSlot(): RecipeSlot {
	return {
		id: `slot_${Date.now()}`,
		label: t('settings.slot.newLabel'),
		type: 'select',
		prompt: '{label}：{value}',
		values: [t('settings.slot.option1'), t('settings.slot.option2')],
		deflt: t('settings.slot.option1'),
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
		this.setTitle(t('settings.edit.title', { name: r.name }));
		this.modalEl.addClass('fn-wizard');
	}

	onOpen() {
		const { contentEl } = this;
		const r = this.r;

		new Setting(contentEl).setName(t('settings.edit.name')).addText(tx => tx.setValue(r.name).onChange(v => { r.name = v; }));
		new Setting(contentEl).setName(t('settings.edit.id')).addText(tx => tx.setValue(r.id).onChange(v => { r.id = v.trim(); }));
		new Setting(contentEl).setName(t('settings.edit.stage'))
			.setDesc(t('settings.edit.stageDesc'))
			.addTextArea(tx => tx.setValue(r.worldview).onChange(v => { r.worldview = v; }));
		new Setting(contentEl).setName(t('settings.edit.forbidden'))
			.setDesc(t('settings.edit.forbiddenDesc'))
			.addText(tx => tx.setValue(r.forbidden.join('；')).onChange(v => {
				r.forbidden = v.split(/[；;]/).map(x => x.trim()).filter(Boolean);
			}));

		contentEl.createEl('h3', { text: t('settings.edit.slotsHeading') });
		r.slots.forEach((slot, i) => {
			const box = contentEl.createDiv({ cls: 'fn-subconflict' });
			const head = new Setting(box).setName(`#${i + 1} ${slot.label}（${slot.type}）`);
			head.addButton(b => b.setButtonText(t('settings.edit.delete')).onClick(() => {
				r.slots.splice(i, 1);
				this.onOpen(); void this.onDone();
			}));
			const rowA = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowA).setName(t('settings.slot.id')).addText(tx => tx.setValue(slot.id).onChange(v => { slot.id = v.trim(); }));
			new Setting(rowA).setName(t('settings.slot.label')).addText(tx => tx.setValue(slot.label).onChange(v => { slot.label = v; }));
			const rowB = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowB).setName(t('settings.slot.inputType')).addDropdown(dd => {
				dd.addOption('select', t('settings.slot.type.select'));
				dd.addOption('number', t('settings.slot.type.number'));
				dd.addOption('text', t('settings.slot.type.text'));
				dd.setValue(slot.type).onChange(v => { slot.type = v as RecipeSlot['type']; });
			});
			new Setting(rowB).setName(t('settings.slot.deflt')).addText(tx => tx.setValue(slot.deflt ?? '').onChange(v => { slot.deflt = v; }));
			new Setting(box).setName(t('settings.slot.prompt'))
				.setDesc(t('settings.slot.promptDesc'))
				.addText(tx => tx.setValue(slot.prompt ?? '').onChange(v => { slot.prompt = v; }));
			new Setting(box).setName(t('settings.slot.values'))
				.addText(tx => tx.setValue((slot.values ?? []).join(',')).onChange(v => {
					slot.values = v.split(/[,，]/).map(x => x.trim()).filter(Boolean);
				}));
			const rowC = box.createDiv({ cls: 'fn-two-col' });
			new Setting(rowC).setName(t('settings.slot.min')).addText(tx => tx.setValue(slot.min != null ? String(slot.min) : '').onChange(v => {
				if (v.trim() === '') { slot.min = undefined; return; }
				const n = parseFloat(v); if (Number.isFinite(n)) slot.min = n;
			}));
			new Setting(rowC).setName(t('settings.slot.max')).addText(tx => tx.setValue(slot.max != null ? String(slot.max) : '').onChange(v => {
				if (v.trim() === '') { slot.max = undefined; return; }
				const n = parseFloat(v); if (Number.isFinite(n)) slot.max = n;
			}));
		});
		new Setting(contentEl).addButton(b => b
			.setButtonText(t('settings.edit.addSlot'))
			.onClick(() => { r.slots.push(newSlot()); this.onOpen(); void this.onDone(); }));

		new Setting(contentEl).addButton(b => b
			.setButtonText(t('settings.edit.save'))
			.setCta()
			.onClick(async () => {
				if (!r.id || !r.name) {
					new Notice(t('settings.edit.idNameRequired'));
					return;
				}
				await this.onDone();
				this.close();
			}));
	}
}
