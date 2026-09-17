/** LLM 调用（标准 OpenAI 兼容 /chat/completions，经 Obsidian requestUrl 绕 CORS）。
 * 任何 OpenAI 兼容端点（MiniMax / DeepSeek / Kimi / Ollama / LM Studio…）均可，
 * MiniMax 仅是出厂默认值。历史经验（默认端点为 MiniMax 时沉淀）：
 * - MiniMax key 属国内平台（api.minimaxi.com）；国际站对同 key 401。
 * - M3 / M2.x 全系是推理模型：回复带 <think>…</think> 前缀，必须剥离，
 *   否则正文污染且 JSON 解析错位（其他端点无此前缀，剥了也无害）。
 * - 偶发 5xx：重试 2 次（指数退避）。
 */
import { requestUrl } from 'obsidian';
import type { MimicSettings } from './types';
import { t } from './i18n';

export function stripThink(s: string): string {
	return s.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/** 从剥完 think 的文本中宽松提取第一个 JSON 对象（容忍代码栅栏与前后杂文）。
 * 提取时重建文本并转义字符串内的裸控制字符（模型常见毛病）；
 * JSON.parse 仍失败则抛带出错位置上下文的错误。 */
export function parseJsonLoose(s: string): Record<string, unknown> {
	const text = stripThink(s);
	const start = text.indexOf('{');
	if (start < 0) throw new Error(t('llm.noJson'));
	let depth = 0, inStr = false, esc = false;
	let rebuilt = '';
	for (let i = start; i < text.length; i++) {
		const c = text[i];
		rebuilt += c;
		if (esc) { esc = false; continue; }
		if (c === '\\') { esc = true; continue; }
		if (c === '"') { inStr = !inStr; continue; }
		if (inStr) {
			if (c === '\n') rebuilt = rebuilt.slice(0, -1) + '\\n';
			else if (c === '\r') rebuilt = rebuilt.slice(0, -1) + '\\r';
			else if (c === '\t') rebuilt = rebuilt.slice(0, -1) + '\\t';
			continue;
		}
		if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) return strictParse(rebuilt);
		}
	}
	throw new Error(t('llm.jsonUnclosed'));
}

function strictParse(json: string): Record<string, unknown> {
	try {
		return JSON.parse(json) as Record<string, unknown>;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const m = /position (\d+)/.exec(msg);
		const p = m ? parseInt(m[1], 10) : -1;
		const ctx = p >= 0 ? `…${json.slice(Math.max(0, p - 50), p + 50)}…` : '';
		throw new Error(t('llm.jsonInvalid', { msg, ctx }));
	}
}

const sleep = (ms: number) => new Promise(r => window.setTimeout(r, ms));

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
				const data = res.json as { error?: unknown } | undefined;
				throw new Error(`HTTP ${res.status}: ${JSON.stringify(data?.error ?? '')}`);
			}
			const data = res.json as { choices?: Array<{ message?: { content?: unknown } }> } | undefined;
			const content = data?.choices?.[0]?.message?.content;
			if (typeof content !== 'string') throw new Error(t('llm.noContent'));
			return stripThink(content);
		} catch (e) {
			lastErr = e instanceof Error ? e.message : String(e);
			// 网络类异常继续重试；结构类错误直接抛
			if (!/HTTP|fetch|network|timeout/i.test(lastErr)) throw e;
		}
	}
	throw new Error(t('llm.failed', { msg: lastErr }));
}
