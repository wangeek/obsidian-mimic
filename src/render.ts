/** 产物落盘：frontmatter（配方与槽位快照 + kp_ids）+ 拟态正文 + 关联知识点链接 */
import { App, TFile, normalizePath } from 'obsidian';
import type { ComposeResult, KpNote } from './types';
import { t } from './i18n';

export interface ComposeMeta {
	model: string;
	recipe: string;
	params: Record<string, string>;
	kpIds: number[];
	/** 关联知识点一句话说明（键 = 知识点标题）；空则回退章节注 */
	linkNotes: Record<string, string>;
}

function ymd(): string {
	const d = new Date();
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function safeName(s: string): string {
	return s.replace(/[\\/:*?"<>|#^\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function fmValue(v: unknown): string {
	if (Array.isArray(v)) return `[${v.map(x => JSON.stringify(x)).join(', ')}]`;
	return JSON.stringify(v);
}

export async function writeComposedNote(
	app: App, outputDir: string, r: ComposeResult, meta: ComposeMeta, kps: KpNote[]
): Promise<string> {
	const dir = normalizePath(outputDir.replace(/\/$/, ''));
	if (!(await app.vault.adapter.exists(dir))) {
		await app.vault.createFolder(dir);
	}

	const fm: Record<string, unknown> = {
		title: r.title,
		created: ymd(),
		model: meta.model,
		recipe: meta.recipe,
		params: meta.params,
		kp_ids: meta.kpIds,
	};
	const fmText = Object.entries(fm)
		.map(([k, v]) => `${k}: ${fmValue(v)}`)
		.join('\n');

	// 链接目标用文件名（去目录去扩展名）：知识点与库外普通笔记（当前笔记入口）都能回链
	const links = kps
		.map(k => {
			const fileName = k.path.split('/').pop()?.replace(/\.md$/i, '') || String(k.kpId);
			const link = `- [[${fileName}|${k.title}]]`;
			const note = (meta.linkNotes[k.title] ?? '').trim();
			if (note) return `${link} — ${note}`;
			return k.chapter
				? `${link} ${t('render.chapterNote', { chapter: k.chapter, chapterTitle: k.chapterTitle })}`
				: link;
		})
		.join('\n');

	const body = [
		'---',
		fmText,
		'---',
		'',
		r.coreSegment,
		'',
		r.narrativeShell,
		'',
		t('render.relatedHeading'),
		'',
		links,
		'',
	].join('\n');

	const base = `${ymd()}-${safeName(r.title) || t('render.untitled')}`;
	let path = `${dir}/${base}.md`;
	let n = 2;
	while (app.vault.getAbstractFileByPath(path) instanceof TFile) {
		path = `${dir}/${base}-${n++}.md`;
	}
	await app.vault.create(path, body);
	return path;
}
