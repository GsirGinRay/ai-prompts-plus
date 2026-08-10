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

  const api = { calculatePanelPosition, filterPrompts, getPromptBatch, isolateHostEvents, isConfirmKey, mountPanel, runPromptAction };
  root.PanelUtils = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
