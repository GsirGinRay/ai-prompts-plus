const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const extensionRoot = path.join(__dirname, '..', 'GPTprompt');
const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'manifest.json'), 'utf8'));

function collectManifestFiles() {
  const files = new Set([
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {})
  ]);

  for (const contentScript of manifest.content_scripts || []) {
    for (const file of [...(contentScript.js || []), ...(contentScript.css || [])]) files.add(file);
  }
  for (const resourceGroup of manifest.web_accessible_resources || []) {
    for (const file of resourceGroup.resources || []) files.add(file);
  }
  return [...files].filter(Boolean);
}

test('all local files declared by the manifest exist', () => {
  for (const file of collectManifestFiles()) {
    assert.equal(fs.existsSync(path.join(extensionRoot, file)), true, `Missing manifest file: ${file}`);
  }
});

test('all static background importScripts dependencies exist', () => {
  const backgroundPath = path.join(extensionRoot, manifest.background.service_worker);
  const backgroundSource = fs.readFileSync(backgroundPath, 'utf8');
  const imports = [...backgroundSource.matchAll(/importScripts\(([^)]+)\)/g)]
    .flatMap(match => [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(fileMatch => fileMatch[1]));

  assert.ok(imports.length > 0, 'Expected at least one background importScripts dependency');
  for (const file of imports) {
    assert.equal(fs.existsSync(path.join(extensionRoot, file)), true, `Missing background dependency: ${file}`);
  }
});
