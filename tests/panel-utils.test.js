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

function createKeyboardWindow() {
  const listeners = new Map();
  class FakeKeyboardEvent {
    constructor(type, init) {
      Object.assign(this, init, { type });
      this.defaultPrevented = false;
    }
    preventDefault() { this.defaultPrevented = true; }
  }
  return {
    listeners,
    KeyboardEvent: FakeKeyboardEvent,
    addEventListener(type, listener, capture) {
      listeners.set(type, { listener, capture });
    },
    removeEventListener(type, listener) {
      if (listeners.get(type)?.listener === listener) listeners.delete(type);
    }
  };
}

function createKeyEvent(path, overrides = {}) {
  return {
    type: 'keydown',
    key: 'a',
    code: 'KeyA',
    keyCode: 65,
    isComposing: false,
    isTrusted: true,
    stopped: false,
    prevented: false,
    composedPath() { return path; },
    stopImmediatePropagation() { this.stopped = true; },
    preventDefault() { this.prevented = true; },
    ...overrides
  };
}

test('shields panel keystrokes from host-page capture listeners and replays them inside the panel', () => {
  const win = createKeyboardWindow();
  const host = {};
  const replayed = [];
  const input = {
    dispatchEvent(event) {
      replayed.push(event);
      if (event.key === 'Enter') event.preventDefault();
      return !event.defaultPrevented;
    }
  };

  const shadowRoot = { activeElement: input };
  let panel = null;

  const cleanup = PanelUtils.shieldKeyboardFromHost(() => panel, win);

  const beforePanelExists = createKeyEvent([host]);
  win.listeners.get('keydown').listener(beforePanelExists);
  assert.equal(beforePanelExists.stopped, false);
  panel = { host, shadowRoot };

  ['keydown', 'keypress', 'keyup'].forEach(type => {
    assert.equal(win.listeners.get(type)?.capture, true);
  });

  // A closed shadow root hides its internals from composedPath() outside the tree.
  const typing = createKeyEvent([host]);
  win.listeners.get('keydown').listener(typing);
  assert.equal(typing.stopped, true);
  assert.equal(typing.prevented, false);
  assert.equal(replayed[0].composed, false);
  assert.equal(replayed[0].key, 'a');
  assert.equal(replayed[0].keyCode, 65);

  const enter = createKeyEvent([host], { key: 'Enter', code: 'Enter', keyCode: 13 });
  win.listeners.get('keydown').listener(enter);
  assert.equal(enter.prevented, true);

  const composerKey = createKeyEvent([{}]);
  win.listeners.get('keydown').listener(composerKey);
  assert.equal(composerKey.stopped, false);

  const syntheticKey = createKeyEvent([host], { isTrusted: false });
  win.listeners.get('keydown').listener(syntheticKey);
  assert.equal(syntheticKey.stopped, false);

  ['paste', 'cut', 'copy'].forEach(type => {
    assert.equal(win.listeners.get(type)?.capture, true);
  });
  const paste = createKeyEvent([host], { type: 'paste' });
  win.listeners.get('paste').listener(paste);
  assert.equal(paste.stopped, true);
  assert.equal(paste.prevented, false);

  shadowRoot.activeElement = null;
  const unfocusedKey = createKeyEvent([host]);
  win.listeners.get('keydown').listener(unfocusedKey);
  assert.equal(unfocusedKey.stopped, true);
  assert.equal(replayed.length, 2);

  cleanup();
  assert.equal(win.listeners.size, 0);
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
test('loads the host event shield at document_start so it runs before host-page listeners', () => {
  const manifest = require('../GPTprompt/manifest.json');
  const earlyScript = manifest.content_scripts.find(entry => entry.run_at === 'document_start');

  assert.deepEqual(earlyScript?.js, ['panel-utils.js', 'host-event-shield.js']);
  assert.deepEqual(earlyScript.matches, manifest.content_scripts[0].matches);
});

test('host event shield registers window capture listeners and accepts the panel later', () => {
  const win = createKeyboardWindow();
  win.PanelUtils = PanelUtils;
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../GPTprompt/host-event-shield.js'), 'utf8');

  new Function('globalThis', source)(win);

  const host = {};
  const keydown = win.listeners.get('keydown');
  assert.equal(keydown.capture, true);
  const early = createKeyEvent([host]);
  keydown.listener(early);
  assert.equal(early.stopped, false);

  win.HostEventShield.setPanel(host, { activeElement: null });
  const typed = createKeyEvent([host]);
  keydown.listener(typed);
  assert.equal(typed.stopped, true);
});

test('popup uses the same black primary color as the in-page panel', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const popupCss = fs.readFileSync(path.join(__dirname, '../GPTprompt/popup.css'), 'utf8');

  assert.match(popupCss, /--primary-color: #000000;/);
  assert.doesNotMatch(popupCss, /#10a37f/i);
});

test('popup can open as a full-page manager and shares list features with the panel', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const popupHtml = fs.readFileSync(path.join(__dirname, '../GPTprompt/popup.html'), 'utf8');
  const popupJs = fs.readFileSync(path.join(__dirname, '../GPTprompt/popup.js'), 'utf8');

  assert.match(popupHtml, /<script src="prompt-utils\.js"><\/script>/);
  assert.match(popupHtml, /id="openInTabBtn"/);
  assert.match(popupJs, /chrome\.runtime\.getURL\('popup\.html\?view=page'\)/);
  assert.match(popupJs, /if \(isPageView\) toast\.remove\(\);\s*else window\.close\(\);/);
  assert.match(popupJs, /class="duplicate-btn"/);
  assert.match(popupJs, /await variableHistory\.save\(currentInsertingPrompt\.id, values\)/);
});

test('deleting a prompt also clears its remembered variable values', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const contentJs = fs.readFileSync(path.join(__dirname, '../GPTprompt/content.js'), 'utf8');
  const popupJs = fs.readFileSync(path.join(__dirname, '../GPTprompt/popup.js'), 'utf8');

  assert.equal((contentJs.match(/await variableHistory\.remove\(/g) || []).length, 2);
  assert.match(popupJs, /await variableHistory\.remove\(id\)/);
});
