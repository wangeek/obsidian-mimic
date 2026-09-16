/** LLM 调用（OpenAI 兼容 /chat/completions，经 Obsidian requestUrl 绕 CORS）。
 *
 * 平台事实（迁移沉淀）：
 * - MiniMax key 属国内平台（api.minimaxi.com）；国际站对同 key 401。
 * - M3 / M2.x 全系是推理模型：回复带 <think>…</think> 前缀，必须剥离，
 *   否则正文污染且 JSON 解析错位。
 * - 偶发 5xx：重试 2 次（指数退避）。
 */
import { requestUrl } from 'obsidian';
import type { MimicSettings } from './types';

export function stripThink(s: string): string {
	return s.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/** 从剥完 think 的文本中宽松提取第一个 JSON 对象（容忍代码栅栏与前后杂文） */
export function parseJsonLoose(s: string): Record<string, unknown> {
	const t = stripThink(s);
	const start = t.indexOf('{');
	if (start < 0) throw new Error('回复中没有 JSON 对象');
	let depth = 0, inStr = false, esc = false;
	for (let i = start; i < t.length; i++) {
		const c = t[i];
		if (esc) { esc = false; continue; }
		if (c === '\\') { esc = true; continue; }
		if (c === '"') { inStr = !inStr; continue; }
		if (inStr) continue;
		if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) {
				return JSON.parse(t.slice(start, i + 1));
			}
		}
	}
	throw new Error('JSON 对象未闭合');
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** 一次 chat 调用（含剥 think） */
export async function chat(
	settings: MimicSettings, system: string, user: string, temperature: number
): Promise<string> {
	let lastErr = '';
	for (let attempt = 0; attempt < 3; attempt++) {
		if (attempt > 0) await sleep(1500 * attempt);
		try {
			const res = await requestUrl({
				url: `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${settings.apiKey}`,
				},
				body: JSON.stringify({
					model: settings.model,
					messages: [
						{ role: 'system', content: system },
						{ role: 'user', content: user },
					],
					temperature,
				}),
				throw: false,
			});
			if (res.status >= 500) { lastErr = `HTTP ${res.status}`; continue; }
			if (res.status !== 200) {
				throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.json?.error ?? '')}`);
			}
			const content = res.json?.choices?.[0]?.message?.content;
			if (typeof content !== 'string') throw new Error('回复结构异常（无 content）');
			return stripThink(content);
		} catch (e) {
			lastErr = e instanceof Error ? e.message : String(e);
			// 网络类异常继续重试；结构类错误直接抛
			if (!/HTTP|fetch|network|timeout/i.test(lastErr)) throw e;
		}
	}
	throw new Error(`LLM 调用失败（已重试）：${lastErr}`);
}
