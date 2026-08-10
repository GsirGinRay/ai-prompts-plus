const test = require('node:test');
const assert = require('node:assert/strict');

const PanelUtils = require('../GPTprompt/panel-utils.js');

test('mounts the prompt panel in the supplied closed shadow root', () => {
  const appended = [];
  const shadowRoot = {
    appendChild(node) { appended.push(node); }
  };
  const panel = { id: 'prompt-manager-panel' };

  assert.equal(PanelUtils.mountPanel(panel, shadowRoot), panel);
  assert.deepEqual(appended, [panel]);
});

test('positions a large panel at the right side of the viewport', () => {
  assert.deepEqual(
    PanelUtils.calculatePanelPosition({ right: 100, bottom: 700 }, 460, 1440),
    { left: 964, top: 16 }
  );
});

test('keeps the right-side panel inside a narrow viewport', () => {
  assert.deepEqual(
    PanelUtils.calculatePanelPosition({ right: 100, bottom: 700 }, 368, 400),
    { left: 16, top: 16 }
  );
});

test('isolates keyboard, paste, and IME composition events', () => {
  const listeners = new Map();
  const panel = {
    addEventListener(eventName, listener) {
      listeners.set(eventName, listener);
    }
  };

  PanelUtils.isolateHostEvents(panel);

  assert.equal(listeners.has('keydown'), true);
  assert.equal(listeners.has('paste'), true);
  assert.equal(listeners.has('beforeinput'), true);
  assert.equal(listeners.has('compositionstart'), true);
  assert.equal(listeners.has('compositionupdate'), true);
  assert.equal(listeners.has('pointerdown'), true);
  assert.equal(listeners.has('mousedown'), true);
  assert.equal(listeners.has('click'), true);
  assert.equal(listeners.has('compositionend'), true);

  let propagationStopped = false;
  listeners.get('paste')({
    stopPropagation() {
      propagationStopped = true;
    }
  });
  assert.equal(propagationStopped, true);
});

test('runPromptAction inserts a prompt for review and ignores stale direct-send options', async () => {
  let inserted = '';
  let sent = false;
  assert.deepEqual(await PanelUtils.runPromptAction({
    content: 'hello',
    insert: async value => {
      inserted = value;
      return true;
    },
    send: async () => {
      sent = true;
      return true;
    },
    sendImmediately: true
  }), { inserted: true, sent: false });
  assert.equal(inserted, 'hello');
  assert.equal(sent, false);
  assert.equal(PanelUtils.isSendConfirmed, undefined);
});

test('runPromptAction reports an insertion failure', async () => {
  assert.deepEqual(await PanelUtils.runPromptAction({
    content: 'hello',
    insert: async () => false
  }), { inserted: false, sent: false, error: 'insert_failed' });
});
test('ignores Enter confirmation while an IME composition is active', () => {
  assert.equal(PanelUtils.isConfirmKey({ key: 'Enter', isComposing: true }), false);
  assert.equal(PanelUtils.isConfirmKey({ key: 'Enter', keyCode: 229 }), false);
  assert.equal(PanelUtils.isConfirmKey({ key: 'Enter', isComposing: false }), true);
});

test('filters 1,000 prompts in under 100ms', () => {
  const prompts = Array.from({ length: 1000 }, (_, index) => ({
    name: `Prompt ${index}`,
    category: index % 2 ? 'Work' : 'Personal',
    content: `A ${'x'.repeat(1000)} ${index}`
  }));
  const startedAt = performance.now();
  const filtered = PanelUtils.filterPrompts(prompts, 'Prompt 99');
  const durationMs = performance.now() - startedAt;
  assert.ok(filtered.length > 0);
  assert.ok(durationMs < 100, `expected <100ms, received ${durationMs.toFixed(2)}ms`);
});

test('returns prompt render batches of at most 100 records', () => {
  const prompts = Array.from({ length: 250 }, (_, index) => ({ id: String(index) }));
  assert.equal(PanelUtils.getPromptBatch(prompts, 0).items.length, 100);
  assert.equal(PanelUtils.getPromptBatch(prompts, 2).items.length, 50);
  assert.equal(PanelUtils.getPromptBatch(prompts, 2).remaining, 0);
});