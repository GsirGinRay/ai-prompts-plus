/** Background service worker: serializes every prompt collection operation. */
importScripts('prompt-store.js');

let promptOperationQueue = Promise.resolve();

chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') await initializeStorage();
});

async function initializeStorage() {
  const result = await chrome.storage.local.get('prompts');
  if (!Array.isArray(result.prompts)) await chrome.storage.local.set({ prompts: [] });
}

function enqueuePromptOperation(operation) {
  const pending = promptOperationQueue.then(operation, operation);
  promptOperationQueue = pending.catch(() => undefined);
  return pending;
}

function generatePromptId() {
  const randomPart = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);
  return `prompt_${Date.now()}_${randomPart}`;
}

async function handlePromptRequest(action, payload) {
  const stored = await chrome.storage.local.get('prompts');
  const prompts = Array.isArray(stored.prompts) ? stored.prompts : [];
  if (action === 'prompt.list') return prompts;

  const operation = PromptStore.applyOperation(prompts, action, payload, {
    generateId: generatePromptId
  });
  await chrome.storage.local.set({ prompts: operation.prompts });
  return operation.result;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (typeof request?.action !== 'string' || !request.action.startsWith('prompt.')) {
    return undefined;
  }

  enqueuePromptOperation(() => handlePromptRequest(request.action, request.payload || {}))
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Prompt operation failed.'
    }));
  return true;
});
