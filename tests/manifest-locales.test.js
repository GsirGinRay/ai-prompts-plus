const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const extensionRoot = path.join(__dirname, '..', 'GPTprompt');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(extensionRoot, relativePath), 'utf8'));
}

test('manifest declares the default locale and localized name/description', () => {
  const manifest = readJson('manifest.json');

  assert.equal(manifest.default_locale, 'zh_TW');
  assert.equal(manifest.name, '__MSG_appName__');
  assert.equal(manifest.description, '__MSG_appDescription__');
});

test('Chinese and English Chrome locale messages are complete', () => {
  const chinese = readJson('_locales/zh_TW/messages.json');
  const english = readJson('_locales/en/messages.json');

  for (const messages of [chinese, english]) {
    assert.equal(typeof messages.appName?.message, 'string');
    assert.equal(typeof messages.appDescription?.message, 'string');
    assert.ok(messages.appName.message.length > 0);
    assert.ok(messages.appDescription.message.length > 0);
  }

  assert.notEqual(chinese.appDescription.message, english.appDescription.message);
});
