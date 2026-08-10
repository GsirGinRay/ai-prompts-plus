const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const screenshotRoot = path.join(__dirname, '..', 'screenshot');

const localizedSets = {
  zh_TW: [
    'zh-tw-01-cross-platform-library.png',
    'zh-tw-02-search.png',
    'zh-tw-03-insert.png',
    'zh-tw-04-variable-colors.png',
    'zh-tw-05-editor-highlight.png'
  ],
  en: [
    'en-01-cross-platform-library.png',
    'en-02-search.png',
    'en-03-insert.png',
    'en-04-variable-colors.png'
  ]
};

test('store listing has five Traditional Chinese and four English screenshots', () => {
  assert.equal(localizedSets.zh_TW.length, 5);
  assert.equal(localizedSets.en.length, 4);

  for (const fileName of [...localizedSets.zh_TW, ...localizedSets.en]) {
    const filePath = path.join(screenshotRoot, fileName);
    assert.ok(fs.existsSync(filePath), `${fileName} should exist`);
    const header = fs.readFileSync(filePath).subarray(0, 24);
    assert.equal(header.toString('ascii', 1, 4), 'PNG');
    assert.equal(header.readUInt32BE(16), 1280);
    assert.equal(header.readUInt32BE(20), 800);
  }
});
