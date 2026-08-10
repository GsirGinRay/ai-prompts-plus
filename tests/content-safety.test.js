const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'GPTprompt');
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'content.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

test('quick access button cannot submit a host form by default', () => {
  assert.match(content, /createElement\('button'\);\s*button\.type = 'button';\s*button\.id = 'prompt-manager-quick-btn'/);
  assert.match(content, /event\.preventDefault\(\);\s*event\.stopPropagation\(\);/);
});
test('selector configuration keeps a distinct entry for every supported platform', () => {
  const selectorConfig = content.slice(
    content.indexOf('const PLATFORM_SELECTORS ='),
    content.indexOf('function detectPlatform')
  );
  const platformEntries = selectorConfig.match(/\[PLATFORMS\.(?:CHATGPT|CLAUDE|GEMINI|GROK)\]:/g) || [];
  assert.equal(platformEntries.length, 4);
  ['CHATGPT', 'CLAUDE', 'GEMINI', 'GROK'].forEach(platform => {
    assert.ok(selectorConfig.includes(`[PLATFORMS.${platform}]:`));
  });
});

test('platform selector lookup fails safely and all quick buttons stay outside host composer trees', () => {
  assert.doesNotMatch(content, /PLATFORM_SELECTORS\[platform\]\.inputContainer/);
  assert.match(content, /PLATFORM_SELECTORS\[platform\]\?\.inputContainer \|\| \[\]/);
  assert.match(content, /function insertComposerOverlayButton\(button, className\) \{[\s\S]*document\.body\.appendChild\(button\)/);
  assert.match(content, /function insertButtonForChatGPT\(button\) \{[\s\S]*return insertComposerOverlayButton\(button/);
  assert.match(content, /function insertButtonForClaude\(button\) \{[\s\S]*return insertComposerOverlayButton\(button/);
  assert.match(content, /function insertButtonForGemini\(button\) \{[\s\S]*return insertComposerOverlayButton\(button/);
  assert.match(content, /function insertButtonForGrok\(button\) \{[\s\S]*return insertComposerOverlayButton\(button/);
  assert.match(content, /function scheduleButtonRecovery[\s\S]*positionComposerOverlayButton\(button\)/);
});
test('all prompt actions insert for review and never trigger host submission', () => {
  assert.doesNotMatch(content, /insertAndSend|prompt-send-btn|sendImmediately/);
  assert.doesNotMatch(content, /clickSendButton|findScopedSendButton|new KeyboardEvent/);
  assert.match(content, /async function performPromptAction\(content\)[\s\S]*PanelUtils\.runPromptAction/);
  assert.match(content, /prompt-insert-btn[\s\S]*insertPrompt/);
});
test('contenteditable insertion always synchronizes an input event', () => {
  assert.match(content, /if \(!inserted\) \{[\s\S]*?selection\.addRange\(range\);\s*\}\s*dispatchComposerInput\(composer, content\);/);
});

test('debounced search captures the input value before shadow event retargeting', () => {
  assert.match(content, /searchInput\.addEventListener\('input', \(\) => \{\s*const queryValue = String\(searchInput\.value \|\| ''\);/);
  assert.doesNotMatch(content, /setTimeout\(\(\) => \{\s*let query = event\.target\.value/);
});
test('prompt mutations invalidate preload cache and storage sync preserves search', () => {
  assert.match(content, /function loadPromptsData\(force = false\)/);
  assert.match(content, /if \(force\) promptsLoadPromise = null/);
  assert.ok((content.match(/await loadPromptsData\(true\)/g) || []).length >= 3);
  assert.match(content, /function refreshPromptListForCurrentSearch\(\) \{[\s\S]*getPanelElement\('#prompt-search'\)/);
  assert.ok((content.match(/refreshPromptListForCurrentSearch\(\)/g) || []).length >= 6);
  assert.match(content, /chrome\.storage\.onChanged[\s\S]*refreshPromptListForCurrentSearch\(\)/);
});
test('prompt data preloads before the first panel click', () => {
  assert.match(content, /let promptsLoadPromise = null/);
  assert.match(content, /function loadPromptsData\(force = false\)/);
  assert.match(content, /async function init\(\) \{[\s\S]*loadPromptsData\(\)/);
  assert.match(content, /async function createPromptPanel\(\) \{[\s\S]*await loadPromptsData\(\)/);
});
test('non-essential promotion lookup does not block the initial panel render', () => {
  const createPanelSource = content.slice(content.indexOf('async function createPromptPanel()'), content.indexOf('function findFirstMatch'));
  const mountIndex = createPanelSource.indexOf('PanelUtils.mountPanel(promptPanel, promptPanelRoot)');
  const promoIndex = createPanelSource.indexOf('loadPromoBannerWhenReady(promptPanel)');
  assert.ok(mountIndex >= 0 && promoIndex > mountIndex);
  assert.doesNotMatch(createPanelSource.slice(0, mountIndex), /await shouldShowPromoBanner\(\)/);
  assert.match(content, /function loadPromoBannerWhenReady\(panel\)[\s\S]*shouldShowPromoBanner\(\)\.then/);
});
test('panel stylesheet host preloads while hidden without display none deferral', () => {
  assert.match(content, /function ensurePromptPanelHost\(\)/);
  assert.match(content, /function scheduleInitialButtonCreation\(\) \{[\s\S]*ensurePromptPanelHost\(\)/);
  assert.match(content, /promptPanelHost\.style\.visibility = 'hidden'/);
  assert.match(content, /function showPromptPanelHost\(\)[\s\S]*visibility = 'visible'/);
  assert.doesNotMatch(content, /promptPanelHost\.style\.display = 'none'/);
  assert.match(content, /promptPanelRoot\.appendChild\(stylesheet\)/);
});
test('prompt data UI is isolated in a closed shadow root', () => {
  assert.match(content, /attachShadow\(\{ mode: 'closed' \}\)/);
  assert.match(content, /PanelUtils\.mountPanel\(promptPanel, promptPanelRoot\)/);
});

test('content and popup prompt writes go through the background queue', () => {
  assert.doesNotMatch(content, /chrome\.storage\.local\.(?:get|set)\([^\n]*prompts/);
  assert.match(background, /let promptOperationQueue = Promise\.resolve\(\)/);
  assert.match(background, /PromptStore\.applyOperation/);
});

test('panel positioning does not subscribe to page scroll or mutation geometry', () => {
  assert.match(content, /promptPanelHost\.style\.top = '16px'/);
  assert.match(content, /promptPanelHost\.style\.right = '16px'/);
  assert.doesNotMatch(content, /addEventListener\('scroll', schedulePromptPanelPosition/);
});

test('initial composer button injection waits until hydration is complete', () => {
  assert.match(content, /let buttonInjectionReady = false/);
  assert.match(content, /window\.addEventListener\('load', scheduleInitialButtonCreation/);
  assert.match(content, /window\.setTimeout\(\(\) => \{[\s\S]*buttonInjectionReady = true;[\s\S]*retryCreateButton\(\);[\s\S]*\}, 750\)/);
  assert.match(content, /scheduleButtonRecovery[\s\S]*if \(!buttonInjectionReady\) return/);
});
test('ChatGPT extension UI stays outside React-managed composer markup', () => {
  assert.match(content, /function insertButtonForChatGPT\(button\) \{[\s\S]*insertComposerOverlayButton\(button/);
  assert.match(content, /function insertComposerOverlayButton\(button, className\) \{[\s\S]*document\.body\.appendChild\(button\);[\s\S]*return true/);
  assert.doesNotMatch(content, /composerForm\.insertBefore\(button/);
  assert.doesNotMatch(content, /form\.insertBefore\(button/);
  assert.match(content, /function scheduleInitialButtonCreation\(\) \{[\s\S]*ensurePromptPanelHost\(\);[\s\S]*retryCreateButton\(\)/);
  assert.doesNotMatch(content, /async function init\(\) \{\s*ensurePromptPanelHost\(\)/);
});
test('body-level quick buttons track the active composer instead of sitting at viewport bottom', () => {
  assert.match(content, /function positionComposerOverlayButton\(button\) \{[\s\S]*findComposer\(\)[\s\S]*getBoundingClientRect\(\)/);
  assert.match(content, /button\.style\.top = `\$\{Math\.max\(8, anchorRect\.top - buttonHeight - 8\)\}px`/);
  assert.match(content, /scheduleButtonRecovery[\s\S]*positionComposerOverlayButton\(button\)/);
});
test('button and preload host recovery cover all matched platforms within one second', () => {
  assert.match(content, /setInterval\(scheduleButtonRecovery, 750\)/);
  assert.match(content, /scheduleButtonRecovery[\s\S]*ensurePromptPanelHost\(\)/);
  assert.match(content, /!document\.getElementById\('ai-prompts-plus-panel-host'\)/);
  assert.equal((content.match(/new MutationObserver/g) || []).length, 1);
});

test('promotion link suppresses opener and referrer data', () => {
  assert.match(content, /rel="noopener noreferrer" referrerpolicy="no-referrer"/);
});

test('manifest keeps the minimal permission and exposes only local panel CSS', () => {
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.version, '2.0.7');
  assert.deepEqual(manifest.web_accessible_resources[0].resources, ['content.css']);
  assert.ok(manifest.content_scripts[0].js.includes('storage.js'));
});

test('shadow host hit testing does not leak panel clicks into the AI composer', () => {
  assert.match(content, /promptPanelHost\.style\.width = 'min\(480px, calc\(100vw - 32px\)\)'/);
  assert.match(css, /\.prompt-panel\s*\{[^}]*position: relative;[^}]*pointer-events: auto;/s);
});
