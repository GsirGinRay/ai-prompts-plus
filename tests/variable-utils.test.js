const test = require('node:test');
const assert = require('node:assert/strict');

const VariableUtils = require('../GPTprompt/variable-utils.js');

test('parses required variables using the legacy syntax', () => {
  assert.deepEqual(VariableUtils.parseVariables('Write about [topic].'), [
    { name: 'topic', defaultValue: null, raw: '[topic]' }
  ]);
});

test('parses and trims a default value', () => {
  assert.deepEqual(VariableUtils.parseVariables('Write about [ topic | AI investing ].'), [
    { name: 'topic', defaultValue: 'AI investing', raw: '[ topic | AI investing ]' }
  ]);
});

test('treats only the first pipe as the default separator', () => {
  assert.deepEqual(VariableUtils.parseVariables('[format|table | bullet list]'), [
    { name: 'format', defaultValue: 'table | bullet list', raw: '[format|table | bullet list]' }
  ]);
});

test('treats an empty default as a required variable', () => {
  assert.deepEqual(VariableUtils.parseVariables('[topic|]'), [
    { name: 'topic', defaultValue: null, raw: '[topic|]' }
  ]);
});

test('merges duplicate variables and uses the first non-empty default', () => {
  assert.deepEqual(
    VariableUtils.parseVariables('[tone] [tone|formal] [tone|casual]'),
    [{ name: 'tone', defaultValue: 'formal', raw: '[tone]' }]
  );
});

test('ignores empty variable names', () => {
  assert.deepEqual(VariableUtils.parseVariables('[] [ ] [|default]'), []);
});

test('replaces required and default variables in one pass', () => {
  const content = '[topic] should use a [tone|friendly] tone.';
  assert.equal(
    VariableUtils.replaceVariables(content, { topic: 'Chrome extensions' }),
    'Chrome extensions should use a friendly tone.'
  );
});

test('uses the default when a supplied value is blank', () => {
  assert.equal(
    VariableUtils.replaceVariables('[topic|AI investing]', { topic: '   ' }),
    'AI investing'
  );
});

test('leaves an unresolved required variable unchanged', () => {
  assert.equal(VariableUtils.replaceVariables('Write about [topic].', {}), 'Write about [topic].');
});

test('replaces variable names containing regular expression characters safely', () => {
  assert.equal(
    VariableUtils.replaceVariables('[price.*] and [price.*]', { 'price.*': '$10' }),
    '$10 and $10'
  );
});

test('uses the merged default for every occurrence of a duplicate variable', () => {
  assert.equal(
    VariableUtils.replaceVariables('[tone] then [tone|formal] then [tone|casual]', {}),
    'formal then formal then formal'
  );
});

test('turns selected text into a variable without requiring syntax knowledge', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about AI investing.', 12, 24),
    {
      content: 'Write about [AI investing].',
      selectionStart: 26,
      selectionEnd: 26
    }
  );
});

test('inserts a named variable with an optional default value at the caret', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about .', 12, 12, 'topic', 'AI investing'),
    {
      content: 'Write about [topic|AI investing].',
      selectionStart: 32,
      selectionEnd: 32
    }
  );
});

test('rejects an empty variable when there is no selected text', () => {
  assert.equal(VariableUtils.insertVariable('Write about .', 12, 12, '  '), null);
});

test('rejects variable names that would break the stored token format', () => {
  assert.equal(
    VariableUtils.insertVariable('Write about .', 12, 12, 'topic|tone'),
    null
  );
  assert.equal(VariableUtils.insertVariable('', 0, 0, 'topic]'), null);
  assert.equal(
    VariableUtils.insertVariable('', 0, 0, 'topic', 'value]after'),
    null
  );
});

test('preserves surrounding whitespace when the selection includes spaces', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about AI investing today.', 11, 25),
    {
      content: 'Write about [AI investing] today.',
      selectionStart: 27,
      selectionEnd: 27
    }
  );
});

test('creates an editable variable draft from selected text', () => {
  assert.deepEqual(
    VariableUtils.createVariableDraft('Write about AI investing.', 12, 24),
    {
      name: 'AI investing',
      defaultValue: '',
      selectionStart: 12,
      selectionEnd: 24
    }
  );
});

test('creates an editable draft from an existing legacy variable token', () => {
  assert.deepEqual(
    VariableUtils.createVariableDraft('Write about [topic].', 12, 19),
    {
      name: 'topic',
      defaultValue: '',
      selectionStart: 12,
      selectionEnd: 19
    }
  );
});

test('expands a selection inside an existing variable to the whole token', () => {
  assert.deepEqual(
    VariableUtils.createVariableDraft('Write about [topic].', 13, 18),
    {
      name: 'topic',
      defaultValue: '',
      selectionStart: 12,
      selectionEnd: 19
    }
  );
});

test('creates an editable draft from an existing variable with a default', () => {
  assert.deepEqual(
    VariableUtils.createVariableDraft('[topic|AI investing]', 0, 20),
    {
      name: 'topic',
      defaultValue: 'AI investing',
      selectionStart: 0,
      selectionEnd: 20
    }
  );
});

test('uses the edited name instead of the selected text when inserting a variable', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about AI.', 12, 14, 'topic'),
    {
      content: 'Write about [topic].',
      selectionStart: 19,
      selectionEnd: 19
    }
  );
});

test('updates an existing legacy variable without nesting brackets', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about [topic].', 12, 19, 'topic', 'AI investing'),
    {
      content: 'Write about [topic|AI investing].',
      selectionStart: 32,
      selectionEnd: 32
    }
  );
});

test('does not add nested brackets when only the variable name was selected', () => {
  assert.deepEqual(
    VariableUtils.insertVariable('Write about [topic].', 13, 18, 'topic', 'AI investing'),
    {
      content: 'Write about [topic|AI investing].',
      selectionStart: 32,
      selectionEnd: 32
    }
  );
});

test('recovers accidentally nested legacy brackets as one variable', () => {
  assert.deepEqual(
    VariableUtils.parseVariables('Write about [[topic]].'),
    [{ name: 'topic', defaultValue: null, raw: '[[topic]]' }]
  );
  assert.equal(
    VariableUtils.replaceVariables('Write about [[topic]].', { topic: 'AI' }),
    'Write about AI.'
  );
});

test('normalizes accidentally nested brackets back to the canonical syntax', () => {
  assert.equal(
    VariableUtils.normalizeVariableTokens('Write [[topic]] in a [[tone|friendly]] tone.'),
    'Write [topic] in a [tone|friendly] tone.'
  );
});

test('creates colorable display parts for a variable name', () => {
  assert.deepEqual(
    VariableUtils.createVariableDisplayParts({ name: 'topic', defaultValue: null }),
    [
      { type: 'bracket', text: '[' },
      { type: 'name', text: 'topic' },
      { type: 'bracket', text: ']' }
    ]
  );
});

test('creates separate colorable parts for a variable default value', () => {
  assert.deepEqual(
    VariableUtils.createVariableDisplayParts({ name: 'topic', defaultValue: 'AI investing' }),
    [
      { type: 'bracket', text: '[' },
      { type: 'name', text: 'topic' },
      { type: 'separator', text: '|' },
      { type: 'default', text: 'AI investing' },
      { type: 'bracket', text: ']' }
    ]
  );
});

test('splits complete prompt content into syntax-highlightable parts', () => {
  assert.deepEqual(
    VariableUtils.createHighlightedContentParts('Write [topic] in a [tone|friendly] tone.'),
    [
      { type: 'text', text: 'Write ' },
      { type: 'bracket', text: '[' },
      { type: 'name', text: 'topic' },
      { type: 'bracket', text: ']' },
      { type: 'text', text: ' in a ' },
      { type: 'bracket', text: '[' },
      { type: 'name', text: 'tone' },
      { type: 'separator', text: '|' },
      { type: 'default', text: 'friendly' },
      { type: 'bracket', text: ']' },
      { type: 'text', text: ' tone.' }
    ]
  );
});

test('keeps invalid empty brackets as normal editor text', () => {
  assert.deepEqual(
    VariableUtils.createHighlightedContentParts('Keep [] unchanged.'),
    [{ type: 'text', text: 'Keep [] unchanged.' }]
  );
});

test('preserves accidental extra brackets in the highlight layer to keep the caret aligned', () => {
  assert.deepEqual(
    VariableUtils.createHighlightedContentParts('[[topic]]'),
    [
      { type: 'bracket', text: '[[' },
      { type: 'name', text: 'topic' },
      { type: 'bracket', text: ']]' }
    ]
  );
});


test('tokenizer returns raw text and source positions', () => {
  assert.deepEqual(VariableUtils.tokenizeVariables('A [topic|AI] B'), [{
    name: 'topic', defaultValue: 'AI', raw: '[topic|AI]', inner: 'topic|AI',
    start: 2, end: 12, openingBracketCount: 1, closingBracketCount: 1
  }]);
});

test('does not rewrite valid nested bracket data such as a matrix', () => {
  const matrix = 'Matrix: [[1,2],[3,4]]';
  assert.equal(VariableUtils.normalizeVariableTokens(matrix), matrix);
});

test('parses 5,000 unmatched opening brackets in linear time', () => {
  const startedAt = process.hrtime.bigint();
  assert.deepEqual(VariableUtils.tokenizeVariables('['.repeat(5000)), []);
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  assert.ok(durationMs < 20, `expected <20ms, received ${durationMs.toFixed(2)}ms`);
});

test('supports variable names that collide with object prototype properties', () => {
  const values = Object.create(null);
  values.__proto__ = 'safe value';
  assert.equal(VariableUtils.replaceVariables('[__proto__]', values), 'safe value');
});

test('highlights 10KB at p95 under 16ms and 100KB under 50ms', () => {
  const tenKb = `${'plain '.repeat(1200)}[topic|AI]`.slice(0, 10 * 1024);
  const samples = [];
  for (let index = 0; index < 30; index += 1) {
    const startedAt = performance.now();
    VariableUtils.createHighlightedContentParts(tenKb);
    samples.push(performance.now() - startedAt);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  assert.ok(p95 < 16, `10KB p95 expected <16ms, received ${p95.toFixed(2)}ms`);

  const hundredKb = `${'plain '.repeat(18000)}[topic|AI]`.slice(0, 100 * 1024);
  const startedAt = performance.now();
  VariableUtils.createHighlightedContentParts(hundredKb);
  const durationMs = performance.now() - startedAt;
  assert.ok(durationMs < 50, `100KB expected <50ms, received ${durationMs.toFixed(2)}ms`);
});