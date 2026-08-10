const test = require('node:test');
const assert = require('node:assert/strict');

const PromptStore = require('../GPTprompt/prompt-store.js');

const existingPrompt = {
  id: 'prompt_1',
  name: 'Original',
  category: 'Work',
  content: 'Use [topic]',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
  usageCount: 9,
  lastUsedAt: '2025-01-03T00:00:00.000Z',
  pinned: true,
  importedAt: '2025-01-04T00:00:00.000Z'
};

test('editing only changes editable fields and preserves metadata', () => {
  const updated = PromptStore.mergePromptUpdate(existingPrompt, {
    id: 'prompt_1', name: 'Updated', category: 'Personal', content: 'New content'
  }, '2026-08-09T00:00:00.000Z');

  assert.deepEqual(updated, {
    ...existingPrompt,
    name: 'Updated',
    category: 'Personal',
    content: 'New content',
    updatedAt: '2026-08-09T00:00:00.000Z'
  });
});

test('rejects an import atomically when any record is invalid', () => {
  assert.throws(() => PromptStore.validateImportData([
    { name: 'Valid', category: '', content: 'ok' },
    { name: 'Invalid', category: '', content: null }
  ]), /content/i);
});

test('rejects imports above the record and field limits', () => {
  assert.throws(() => PromptStore.validateImportData(Array.from({ length: 1001 }, () => ({
    name: 'Prompt', category: '', content: 'ok'
  }))), /1,000/);
  assert.throws(() => PromptStore.validateImportData([
    { name: 'x'.repeat(201), category: '', content: 'ok' }
  ]), /200/);
});

test('rejects source files larger than 5 MiB before parsing', () => {
  assert.throws(() => PromptStore.parseImportJson(' '.repeat(5 * 1024 * 1024 + 1)), /5 MiB/);
});

test('rejects a merged prompt collection larger than 8 MiB', () => {
  const prompts = Array.from({ length: 90 }, (_, index) => ({
    id: `prompt_${index}`, name: `Prompt ${index}`, category: '', content: 'x'.repeat(100000)
  }));
  assert.throws(() => PromptStore.assertCollectionSize(prompts), /8 MiB/);
});

test('sanitizes imported records to the supported storage schema', () => {
  const [prompt] = PromptStore.validateImportData([{
    name: 'Imported', category: 'Test', content: '<img src=x onerror=alert(1)>',
    arbitrarySecret: 'must not persist'
  }]);
  assert.equal(prompt.arbitrarySecret, undefined);
  assert.equal(prompt.content, '<img src=x onerror=alert(1)>');
});

test('save operation preserves existing metadata', () => {
  const operation = PromptStore.applyOperation([existingPrompt], 'prompt.save', {
    prompt: { id: 'prompt_1', name: 'Edited', category: 'Work', content: 'Edited content' }
  }, { now: '2026-08-09T00:00:00.000Z', generateId: () => 'unused' });
  assert.equal(operation.prompts[0].usageCount, 9);
  assert.equal(operation.prompts[0].pinned, true);
  assert.equal(operation.result.name, 'Edited');
});

test('increment operation changes usage in one immutable collection update', () => {
  const operation = PromptStore.applyOperation([existingPrompt], 'prompt.incrementUsage', {
    id: 'prompt_1'
  }, { now: '2026-08-09T00:00:00.000Z' });
  assert.equal(operation.prompts[0].usageCount, 10);
  assert.equal(operation.prompts[0].lastUsedAt, '2026-08-09T00:00:00.000Z');
  assert.equal(existingPrompt.usageCount, 9);
});

test('imports wrapped export data and generates fresh IDs atomically', () => {
  const operation = PromptStore.applyOperation([], 'prompt.import', {
    jsonData: JSON.stringify({ prompts: [{ name: 'Imported', category: '', content: 'ok' }] }),
    merge: true
  }, { now: '2026-08-09T00:00:00.000Z', generateId: () => 'prompt_new' });
  assert.equal(operation.prompts[0].id, 'prompt_new');
  assert.equal(operation.prompts[0].importedAt, '2026-08-09T00:00:00.000Z');
  assert.deepEqual(operation.result, { success: true, count: 1 });
});
