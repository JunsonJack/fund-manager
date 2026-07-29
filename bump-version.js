const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'version.json');
const manifestPath = path.join(__dirname, 'src', 'manifest.json');
const configDir = path.join(__dirname, 'src', 'config');
const versionJsPath = path.join(configDir, 'version.js');

// 读取当前版本
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
let [major, minor, patch] = versionData.version.split('.').map(Number);
let build = versionData.build || 1;

// patch +1
patch += 1;
build += 1;

const newVersion = `${major}.${minor}.${patch}`;
const newVersionCode = build;

// 更新 version.json
fs.writeFileSync(versionPath, JSON.stringify({
  version: newVersion,
  build: newVersionCode
}, null, 2) + '\n');

// 同步更新 manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
manifest.versionName = newVersion;
manifest.versionCode = String(newVersionCode);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// 生成 src/config/version.js
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}
fs.writeFileSync(versionJsPath, `// 由 bump-version.js 自动生成，请勿手动修改
export const VERSION = '${newVersion}'
export const BUILD = ${newVersionCode}
export const VERSION_TEXT = 'v${newVersion} (${newVersionCode})'
`);

console.log(`✅ 版本已更新: v${newVersion} (${newVersionCode})`);
