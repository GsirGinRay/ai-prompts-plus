const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionRoot = process.env.AI_PROMPTS_EXTENSION_ROOT || path.join(__dirname, '..', 'GPTprompt');

test('packaged background service starts and responds to prompt.list', async () => {
  let messageListener;
  let commandListener;
  const sentMessages = [];
  const storedData = { prompts: [] };
  const chrome = {
    commands: {
      onCommand: {
        addListener(listener) {
          commandListener = listener;
        }
      }
    },
    tabs: {
      async query() {
        return [{ id: 7 }];
      },
      async sendMessage(tabId, message) {
        sentMessages.push({ tabId, message });
      }
    },
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: {
        addListener(listener) {
          messageListener = listener;
        }
      }
    },
    storage: {
      local: {
        async get(key) {
          return { [key]: storedData[key] };
        },
        async set(updates) {
          Object.assign(storedData, updates);
        }
      }
    }
  };
  const context = vm.createContext({
    chrome,
    console,
    crypto: { randomUUID: () => 'test-uuid' },
    setTimeout,
    clearTimeout,
    TextDecoder,
    TextEncoder
  });
  context.importScripts = (...files) => {
    for (const file of files) {
      const scriptPath = path.join(extensionRoot, file);
      const source = fs.readFileSync(scriptPath, 'utf8');
      vm.runInContext(source, context, { filename: scriptPath });
    }
  };

  const backgroundPath = path.join(extensionRoot, 'background.js');
  vm.runInContext(fs.readFileSync(backgroundPath, 'utf8'), context, { filename: backgroundPath });
  assert.equal(typeof messageListener, 'function');
  assert.equal(typeof commandListener, 'function');

  await commandListener('toggle-prompt-panel');
  await commandListener('unknown-command');
  // Messages are built inside the vm context, so compare their JSON shape.
  assert.equal(JSON.stringify(sentMessages), JSON.stringify([{ tabId: 7, message: { action: 'togglePromptPanel' } }]));

  const response = await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Background response timed out.')), 1000);
    const keepChannelOpen = messageListener({ action: 'prompt.list' }, {}, result => {
      clearTimeout(timeoutId);
      resolve(result);
    });
    assert.equal(keepChannelOpen, true);
  });

  assert.equal(response.success, true);
  assert.deepEqual(Array.from(response.data), []);
});
