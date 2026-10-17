import test from 'node:test'
import assert from 'node:assert/strict'
import { parseJson, provider, askJson } from '../api/_ai.js'

test('JSON is taken out of fences and surrounding text', () => {
  assert.deepEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 })
  assert.deepEqual(parseJson('Here you go: {"a":[1,2]} thanks'), { a: [1, 2] })
  assert.equal(parseJson('no json'), null)
})
test('no key means unavailable; OpenRouter is used when its key is set', async () => {
  delete process.env.OPENROUTER_API_KEY; delete process.env.ANTHROPIC_API_KEY
  assert.equal(provider(), null); assert.equal((await askJson({ system: 's', user: 'u', schema: {} })).unavailable, true)
  process.env.OPENROUTER_API_KEY = 'k'; assert.equal(provider(), 'openrouter')
  const calls = []; const real = globalThis.fetch
  globalThis.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization }); return { status: 200, ok: true, json: async () => ({ model: 'x/y:free', choices: [{ message: { content: 'Sure: {"items":[]}' } }] }) } }
  const r = await askJson({ system: 's', user: 'u', schema: { type: 'object' } })
  assert.equal(r.ok, true); assert.deepEqual(r.data, { items: [] }); assert.equal(r.engine, 'openrouter:x/y:free')
  assert.equal(calls[0].auth, 'Bearer k'); assert.equal(calls[0].body.models.length, 3); assert.equal(calls[0].body.temperature, 0)
  globalThis.fetch = async () => ({ status: 429, ok: false, json: async () => ({}) })
  assert.equal((await askJson({ system: 's', user: 'u', schema: {} })).status, 429)
  globalThis.fetch = real; delete process.env.OPENROUTER_API_KEY
})
