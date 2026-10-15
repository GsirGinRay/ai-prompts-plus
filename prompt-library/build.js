const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const sourcePath = path.join(root, 'library.json');
const outputRoot = path.join(root, 'dist');
const skoolRoot = path.join(outputRoot, 'skool');
const lesson01TemplatePath = path.join(root, 'skool-lesson-01.md');
const extensionRoot = path.join(root, '..');
const githubBundlePath = path.join(extensionRoot, 'library', 'ai-prompts-plus-full.json');
const DOWNLOAD_URL = 'https://github.com/GsirGinRay/ai-prompts-plus/releases/download/prompt-library/ai-prompts-plus-full.json';
const STORE_URL = 'https://chromewebstore.google.com/detail/ai-%E6%8F%90%E7%A4%BA%E8%A9%9E%2B/dpdaigiggolhaicbejodcglmmifenlaf?hl=zh-TW';
const USAGE_LINE = '使用方式：複製需要的提示詞；`[欄位|預設內容]` 中直線後方是可直接使用的預設值，可自行替換。插入 AI 平台後請先檢查內容與附件，再手動送出。';

function readLibrary() {
  const library = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (library.schemaVersion !== 1) throw new Error('Unsupported library schema version.');
  if (!library.libraryId || !library.libraryVersion) throw new Error('Library metadata is incomplete.');
  if (!Array.isArray(library.lessons) || !Array.isArray(library.prompts)) {
    throw new Error('Lessons and prompts must be arrays.');
  }

  const sourceIds = new Set();
  for (const prompt of library.prompts) {
    for (const field of ['sourceId', 'lesson', 'name', 'category', 'description', 'content']) {
      if (typeof prompt[field] !== 'string') throw new Error(`${prompt.sourceId || 'Prompt'}: ${field} must be a string.`);
    }
    if (sourceIds.has(prompt.sourceId)) throw new Error(`Duplicate sourceId: ${prompt.sourceId}`);
    sourceIds.add(prompt.sourceId);
  }
  return library;
}

function createImportBundle(library) {
  return {
    format: 'ai-prompts-plus-library',
    schemaVersion: 1,
    library: {
      id: library.libraryId,
      version: library.libraryVersion,
      title: library.title
    },
    prompts: library.prompts.map(prompt => ({
      sourceId: prompt.sourceId,
      name: prompt.name,
      category: prompt.category,
      content: prompt.content,
      pinned: prompt.pinned === true
    }))
  };
}

// Lessons 02-10 deliberately omit the library version so a version bump only
// republishes the pages whose prompts actually changed.
function createLessonMarkdown(lesson, prompts) {
  const intro = Array.isArray(lesson.intro) ? lesson.intro : [];
  const lines = [...intro.flatMap(paragraph => [paragraph, '']), USAGE_LINE, ''];

  prompts.forEach((prompt, index) => {
    lines.push(
      `## 【${index + 1}】${prompt.name}`,
      '',
      `用途：${prompt.description}`,
      '',
      '### 提示詞',
      '',
      '```text',
      prompt.content,
      '```',
      ''
    );
  });
  return `${lines.join('\n').trim()}\n`;
}

function readExtensionRelease() {
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'GPTprompt', 'manifest.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(extensionRoot, 'CHANGELOG.md'), 'utf8');
  const escaped = manifest.version.replace(/\./g, '\\.');
  const match = changelog.match(new RegExp(`^## \\[${escaped}\\] - (\\d{4}-\\d{2}-\\d{2})`, 'm'));
  if (!match) throw new Error(`CHANGELOG.md has no entry for v${manifest.version}.`);
  return { version: manifest.version, releaseDate: match[1] };
}

// Lesson 01 is a step-by-step article; images/step-*.png come from
// skool-course-uploader/prompt-library-sync/capture-guide.mjs.
function createImportLesson(library, fileName) {
  const release = readExtensionRelease();
  const values = {
    promptCount: String(library.prompts.length),
    pluginVersion: release.version,
    pluginReleaseDate: release.releaseDate,
    libraryVersion: library.libraryVersion,
    bundleFileName: fileName,
    storeUrl: STORE_URL,
    downloadUrl: DOWNLOAD_URL
  };
  const rendered = fs.readFileSync(lesson01TemplatePath, 'utf8')
    .replace(/\{\{(\w+)\}\}/g, (token, key) => {
      if (!(key in values)) throw new Error(`Unknown lesson 01 placeholder: ${token}`);
      return values[key];
    });
  return rendered.endsWith('\n') ? rendered : `${rendered}\n`;
}

function writeOutputs(library) {
  fs.mkdirSync(skoolRoot, { recursive: true });
  const fileName = `ai-prompts-plus-${library.libraryVersion}.json`;
  const bundle = `${JSON.stringify(createImportBundle(library), null, 2)}\n`;
  fs.writeFileSync(path.join(outputRoot, fileName), bundle, 'utf8');
  // Fixed-name copy published on GitHub so the download link never changes.
  fs.mkdirSync(path.dirname(githubBundlePath), { recursive: true });
  fs.writeFileSync(githubBundlePath, bundle, 'utf8');
  fs.writeFileSync(
    path.join(skoolRoot, '01-import-and-update.md'),
    createImportLesson(library, fileName),
    'utf8'
  );

  for (const lesson of library.lessons) {
    const prompts = library.prompts.filter(prompt => prompt.lesson === lesson.id);
    fs.writeFileSync(
      path.join(skoolRoot, `${lesson.id}.md`),
      createLessonMarkdown(lesson, prompts),
      'utf8'
    );
  }
}

const library = readLibrary();
writeOutputs(library);
console.log(`Built ${library.prompts.length} prompts for library ${library.libraryVersion}.`);
