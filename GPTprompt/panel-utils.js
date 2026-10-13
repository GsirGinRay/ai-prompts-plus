/**
 * Keeps extension UI events and DOM placement separate from host-page composers.
 */
(function initializePanelUtils(root) {
  const ISOLATED_EVENT_TYPES = [
    'pointerdown',
    'pointerup',
    'mousedown',
    'mouseup',
    'click',
    'keydown',
    'keyup',
    'keypress',
    'beforeinput',
    'input',
    'change',
    'compositionstart',
    'compositionupdate',
    'compositionend',
    'paste',
    'cut',
    'focusin',
    'focusout'
  ];

  function isolateHostEvents(panel) {
    ISOLATED_EVENT_TYPES.forEach(eventName => {
      panel.addEventListener(eventName, event => event.stopPropagation());
    });
  }

  const SHIELDED_KEY_EVENT_TYPES = ['keydown', 'keypress', 'keyup'];
  const SHIELDED_CLIPBOARD_EVENT_TYPES = ['paste', 'cut', 'copy'];

  /**
   * Host pages (e.g. ChatGPT) listen for keystrokes and paste in the window/document
   * capture phase and redirect them to their composer when the event target is not
   * editable. A closed shadow root retargets our inputs to the plain host div, so stop
   * trusted events at window capture; keystrokes are replayed inside the shadow tree
   * only (composed: false). Native default actions (typing, pasting) still happen.
   * Install this before host scripts run (document_start) so it fires first.
   * composedPath() hides closed-shadow internals here, so the replay target comes from
   * shadowRoot.activeElement. getPanel returns { host, shadowRoot } or null.
   * Limits: clipboard events are stopped without a replay (panel code must not rely on
   * paste/cut/copy listeners), and replayed keys only carry key/code/modifiers/keyCode.
   */
  function shieldKeyboardFromHost(getPanel, win = root) {
    const findPanel = event => {
      const panel = getPanel();
      if (!panel?.host || !event.isTrusted) return null;
      return event.composedPath().includes(panel.host) ? panel : null;
    };
    const clipboardListener = event => {
      if (findPanel(event)) event.stopImmediatePropagation();
    };
    const listener = event => {
      const panel = findPanel(event);
      if (!panel) return;
      event.stopImmediatePropagation();

      const target = panel.shadowRoot.activeElement;
      if (!target) return;
      const replay = new win.KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        location: event.location,
        repeat: event.repeat,
        isComposing: event.isComposing,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        bubbles: true,
        cancelable: true,
        composed: false
      });
      Object.defineProperty(replay, 'keyCode', { value: event.keyCode });
      if (!target.dispatchEvent(replay)) event.preventDefault();
    };

    SHIELDED_KEY_EVENT_TYPES.forEach(type => win.addEventListener(type, listener, true));
    SHIELDED_CLIPBOARD_EVENT_TYPES.forEach(type => win.addEventListener(type, clipboardListener, true));
    return () => {
      SHIELDED_KEY_EVENT_TYPES.forEach(type => win.removeEventListener(type, listener, true));
      SHIELDED_CLIPBOARD_EVENT_TYPES.forEach(type => win.removeEventListener(type, clipboardListener, true));
    };
  }

  function calculatePanelPosition(_anchorRect, panelWidth, viewportWidth, _gap = 8, margin = 16) {
    return { left: Math.max(margin, viewportWidth - panelWidth - margin), top: margin };
  }

  function mountPanel(panel, rootNode = root.document?.body) {
    rootNode.appendChild(panel);
    return panel;
  }

  async function runPromptAction({ content, insert }) {
    const inserted = await insert(content);
    if (inserted === false) return { inserted: false, sent: false, error: 'insert_failed' };
    return { inserted: true, sent: false };
  }
  function isConfirmKey(event) {
    return event?.key === 'Enter' && !event.isComposing && event.keyCode !== 229;
  }

  function filterPrompts(prompts, query) {
    const normalizedQuery = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
    if (!normalizedQuery) return prompts;
    return prompts.filter(prompt =>
      String(prompt.name || '').toLocaleLowerCase().includes(normalizedQuery) ||
      String(prompt.content || '').toLocaleLowerCase().includes(normalizedQuery) ||
      String(prompt.category || '').toLocaleLowerCase().includes(normalizedQuery)
    );
  }

  function getPromptBatch(prompts, batchIndex = 0, batchSize = 100) {
    const safeIndex = Math.max(0, batchIndex);
    const start = safeIndex * batchSize;
    const items = prompts.slice(start, start + batchSize);
    return { items, remaining: Math.max(0, prompts.length - start - items.length) };
  }

  const api = { calculatePanelPosition, filterPrompts, getPromptBatch, isolateHostEvents, isConfirmKey, mountPanel, runPromptAction, shieldKeyboardFromHost };
  root.PanelUtils = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
