const test = require('node:test');
const assert = require('node:assert/strict');

const PromptUtils = require('../GPTprompt/prompt-utils.js');

const prompts = [
  { id: 'a', name: 'Beta', category: '寫作', content: 'b', usageCount: 5, lastUsedAt: '2026-10-01T00:00:00Z', pinned: false },
  { id: 'b', name: 'alpha', category: '投資', content: 'a', usageCount: 1, lastUsedAt: '2026-10-12T00:00:00Z', pinned: false },
  { id: 'c', name: 'Gamma', category: '寫作', content: 'g', usageCount: 9, lastUsedAt: null, pinned: true },
  { id: 'd', name: 'Delta', category: '', content: 'd', usageCount: 0, lastUsedAt: null, pinned: false }
];

test('sortPrompts keeps pinned prompts first and orders the rest by the chosen mode', () => {
  assert.deepEqual(PromptUtils.sortPrompts(prompts, 'usage').map(p => p.id), ['c', 'a', 'b', 'd']);
  assert.deepEqual(PromptUtils.sortPrompts(prompts, 'recent').map(p => p.id), ['c', 'b', 'a', 'd']);
  assert.deepEqual(PromptUtils.sortPrompts(prompts, 'name').map(p => p.id), ['c', 'b', 'a', 'd']);
});

test('sortPrompts falls back to usage order for unknown modes and does not mutate input', () => {
  const input = [...prompts];
  assert.deepEqual(PromptUtils.sortPrompts(input, 'nope').map(p => p.id), ['c', 'a', 'b', 'd']);
  assert.deepEqual(input.map(p => p.id), ['a', 'b', 'c', 'd']);
});

test('getCategories lists distinct non-empty categories by frequency', () => {
  assert.deepEqual(PromptUtils.getCategories(prompts), ['寫作', '投資']);
});

test('filterByCategory returns everything for an empty category', () => {
  assert.equal(PromptUtils.filterByCategory(prompts, '').length, 4);
  assert.deepEqual(PromptUtils.filterByCategory(prompts, '寫作').map(p => p.id), ['a', 'c']);
});

test('createDuplicateDraft copies editable fields without identity or stats', () => {
  assert.deepEqual(
    PromptUtils.createDuplicateDraft(prompts[0], '（副本）'),
    { name: 'Beta（副本）', category: '寫作', content: 'b' }
  );
});

test('mergeVariableValues prefers remembered values over defaults', () => {
  const variables = [
    { name: '主題', defaultValue: 'AI' },
    { name: '字數', defaultValue: '' },
    { name: '語氣', defaultValue: '專業' }
  ];
  assert.deepEqual(
    PromptUtils.mergeVariableValues(variables, { 主題: '半導體', 字數: '  ', 其他: 'x' }),
    { 主題: '半導體', 字數: '', 語氣: '專業' }
  );
});

test('VariableHistory loads and saves remembered values through chrome.storage.local', async () => {
  const store = {};
  const storage = {
    async get(key) { return { [key]: store[key] }; },
    async set(values) { Object.assign(store, values); }
  };
  const history = PromptUtils.createVariableHistory(storage, 2);

  assert.deepEqual(await history.load('p1'), {});
  await history.save('p1', new Map([['主題', 'AI']]));
  await history.save('p2', { 主題: 'B' });
  await history.save('p3', { 主題: 'C' });
  assert.deepEqual(await history.load('p3'), { 主題: 'C' });
  // Oldest entry is evicted once the limit is exceeded.
  assert.deepEqual(await history.load('p1'), {});
});

test('VariableHistory removes the remembered values of a deleted prompt', async () => {
  const store = {};
  const storage = {
    async get(key) { return { [key]: store[key] }; },
    async set(values) { Object.assign(store, values); }
  };
  const history = PromptUtils.createVariableHistory(storage);

  await history.save('p1', { 主題: 'A' });
  await history.save('p2', { 主題: 'B' });
  await history.remove('p1');
  await history.remove('missing');

  assert.deepEqual(await history.load('p1'), {});
  assert.deepEqual(await history.load('p2'), { 主題: 'B' });
  assert.deepEqual(Object.keys(store.variableHistory), ['p2']);
});
