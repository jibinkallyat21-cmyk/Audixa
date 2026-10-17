import test from 'node:test'
import assert from 'node:assert/strict'
import { readStore, writeStore, connectCloud, disconnectCloud, flush, cloudState } from '../src/utils/store.js'

function fakeClient(rows = []) {
  const calls = { upserts: [], removed: 0 }; let handler = null; let fail = false
  return {
    calls, emit: (p) => handler(p), failNext: () => { fail = true },
    from: () => ({
      select: async () => ({ data: rows, error: null }),
      upsert: async (batch) => { if (fail) { fail = false; return { error: { message: 'offline' } } } calls.upserts.push(batch); return { error: null } },
    }),
    channel: () => { const ch = { on: (_t, _f, cb) => { handler = cb; return ch }, subscribe: () => ch }; return ch },
    removeChannel: async () => { calls.removed++ },
  }
}

test('connect loads the shared data; reads stay synchronous', async () => {
  const c = fakeClient([{ key: 'queries', value: [{ id: 1 }] }])
  await connectCloud(c)
  assert.deepEqual(readStore('queries', []), [{ id: 1 }]); assert.equal(readStore('nothing', 'x'), 'x')
  await disconnectCloud()
})
test('writes are saved in one batch and failed saves are retried', async () => {
  const c = fakeClient(); await connectCloud(c)
  writeStore('a', { n: 1 }); writeStore('b', [2]); writeStore('a', { n: 3 })
  assert.equal(cloudState().pending, 2)
  c.failNext(); await flush(); assert.equal(cloudState().pending, 2); assert.equal(cloudState().error, 'offline')
  await flush(); assert.equal(cloudState().pending, 0); assert.equal(c.calls.upserts.length, 1)
  assert.deepEqual(c.calls.upserts[0].map((r) => [r.key, r.value]).sort(), [['a', { n: 3 }], ['b', [2]]])
  await disconnectCloud()
})
test('changes from another user arrive, own echoes do not undo newer local edits', async () => {
  const c = fakeClient(); await connectCloud(c)
  c.emit({ eventType: 'INSERT', new: { key: 'x', value: { v: 1 } } }); assert.deepEqual(readStore('x', null), { v: 1 })
  writeStore('x', { v: 2 }); c.emit({ eventType: 'UPDATE', new: { key: 'x', value: { v: 1 } } }); assert.deepEqual(readStore('x', null), { v: 2 })
  c.emit({ eventType: 'DELETE', old: { key: 'x' } }); await flush()
  await disconnectCloud(); assert.equal(c.calls.removed, 1); assert.equal(cloudState().connected, false)
})
