// One place that talks to a language model, for every serverless function that needs one.
// Provider by environment variable (set in Vercel, never in the code or the chat):
//   OPENROUTER_API_KEY  uses OpenRouter; OPENROUTER_MODELS = comma list of model ids (first is tried first, up to three). Free ":free" models work.
//   ANTHROPIC_API_KEY   uses Claude; ANTHROPIC_MODEL optional.
// OpenRouter wins when both are set. With neither, askJson answers { ok: false, unavailable: true } and the app falls back to code.
// Free models can keep what is sent to them: send dummy data only.
import Anthropic from '@anthropic-ai/sdk'

const FREE_DEFAULT = ['openai/gpt-oss-120b:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen3-235b-a22b:free']
export const provider = () => (process.env.OPENROUTER_API_KEY ? 'openrouter' : process.env.ANTHROPIC_API_KEY ? 'claude' : null)

// Models often wrap JSON in text or code fences.
export function parseJson(text) {
  const t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try { return JSON.parse(t) } catch { /* try the outermost braces */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}')
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)) } catch { /* fall through */ } }
  return null
}

async function viaOpenRouter({ system, user, schema, maxTokens, timeoutMs }) {
  const list = (process.env.OPENROUTER_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const models = (list.length ? list : FREE_DEFAULT).slice(0, 3)
  const hint = `\n\nAnswer with one JSON object only, no other text, matching this JSON schema:\n${JSON.stringify(schema)}`
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(timeoutMs),
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.ALLOWED_ORIGIN || 'https://audit360.local', 'X-Title': 'Audit 360' },
    body: JSON.stringify({ model: models[0], models, temperature: 0, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user + hint }] }),
  })
  if (r.status === 401) return { ok: false, status: 502, reason: 'The OpenRouter key was rejected' }
  if (r.status === 402) return { ok: false, status: 502, reason: 'OpenRouter reports a negative credit balance' }
  if (r.status === 429) return { ok: false, status: 429, reason: 'The free models are busy or today\'s free limit is used up. Try again later.' }
  const j = await r.json().catch(() => null)
  if (!r.ok || !j) return { ok: false, status: 502, reason: `OpenRouter error ${r.status}${j?.error?.message ? `: ${j.error.message}` : ''}` }
  const data = parseJson(j.choices?.[0]?.message?.content)
  if (!data) return { ok: false, status: 502, reason: 'The model did not return usable JSON' }
  return { ok: true, data, engine: `openrouter:${j.model || models[0]}` }
}

async function viaClaude({ system, user, schema, maxTokens, timeoutMs }) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'
  try {
    const client = new Anthropic({ timeout: timeoutMs, maxRetries: 1 })
    const response = await client.messages.create({ model, max_tokens: maxTokens, system, output_config: { effort: 'low', format: { type: 'json_schema', schema } }, messages: [{ role: 'user', content: user }] })
    if (response.stop_reason === 'refusal') return { ok: false, status: 200, reason: 'The AI review could not be done' }
    const text = response.content.find((b) => b.type === 'text')?.text
    if (response.stop_reason === 'max_tokens' || !text) return { ok: false, status: 502, reason: 'The review did not finish' }
    return { ok: true, data: JSON.parse(text), engine: `claude:${model}` }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, status: 502, reason: 'Claude API key was rejected' }
    if (e instanceof Anthropic.RateLimitError) return { ok: false, status: 429, reason: 'Claude is busy, try again shortly' }
    if (e instanceof Anthropic.APIError) return { ok: false, status: 502, reason: `Claude API error ${e.status}` }
    return { ok: false, status: 502, reason: `Review failed: ${e.name === 'AbortError' ? 'request timed out' : e.message}` }
  }
}

export async function askJson({ system, user, schema, maxTokens = 3000, timeoutMs = 55000 }) {
  const p = provider()
  if (!p) return { ok: false, unavailable: true, status: 200, reason: 'The AI step is not configured yet (no OPENROUTER_API_KEY or ANTHROPIC_API_KEY)' }
  try { return p === 'openrouter' ? await viaOpenRouter({ system, user, schema, maxTokens, timeoutMs }) : await viaClaude({ system, user, schema, maxTokens, timeoutMs }) }
  catch (e) { return { ok: false, status: 502, reason: `The AI step failed: ${e.name === 'TimeoutError' || e.name === 'AbortError' ? 'request timed out' : e.message}` } }
}
