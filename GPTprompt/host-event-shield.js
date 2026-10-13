/**
 * Runs at document_start so its window capture listeners are registered before any
 * host-page listener (ChatGPT redirects keystrokes and paste to its composer).
 * content.js registers the prompt panel via HostEventShield.setPanel().
 */
(function initializeHostEventShield(root) {
  let panel = null;

  root.PanelUtils.shieldKeyboardFromHost(() => panel, root);

  root.HostEventShield = {
    setPanel(host, shadowRoot) {
      panel = { host, shadowRoot };
    }
  };
})(globalThis);
