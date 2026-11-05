import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const checker = path.join(root, 'scripts', 'distribution.mjs');
const json = filename => JSON.parse(readFileSync(filename, 'utf8'));

test('plugin e marketplace reutilizam a skill e a versao do pacote', () => {
  const packageData = json(path.join(root, 'package.json'));
  const plugin = json(path.join(root, '.claude-plugin', 'plugin.json'));
  const marketplace = json(path.join(root, '.claude-plugin', 'marketplace.json'));
  assert.equal(plugin.name, 'rataria');
  assert.equal(plugin.version, packageData.version);
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(path.resolve(root, marketplace.plugins[0].source), root);
  assert.equal(existsSync(path.join(root, 'skills', 'rataria', 'SKILL.md')), true);
  assert.equal(plugin.hooks, undefined);
  assert.equal(plugin.mcpServers, undefined);
});

test('check de distribuicao le os manifests sem modifica-los', () => {
  const result = spawnSync(process.execPath, [checker, 'check'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('sincronizacao explicita corrige versao em copia isolada e preserva campos do plugin', context => {
  const directory = mkdtempSync(path.join(tmpdir(), 'rataria-version-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const name of ['scripts', '.claude-plugin', 'skills', 'cli', 'lib']) {
    cpSync(path.join(root, name), path.join(directory, name), { recursive: true });
  }
  const packageData = json(path.join(root, 'package.json'));
  packageData.version = '0.2.0';
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify(packageData));
  const script = path.join(directory, 'scripts', 'distribution.mjs');
  const pluginPath = path.join(directory, '.claude-plugin', 'plugin.json');
  const before = json(pluginPath);
  const check = spawnSync(process.execPath, [script, 'check'], { cwd: directory, encoding: 'utf8' });
  assert.equal(check.status, 1);
  assert.match(check.stderr, /versao/i);
  const sync = spawnSync(process.execPath, [script, 'sync'], { cwd: directory, encoding: 'utf8' });
  assert.equal(sync.status, 0, sync.stderr);
  assert.deepEqual(json(pluginPath), { ...before, version: '0.2.0' });
  assert.equal(spawnSync(process.execPath, [script, 'check'], { cwd: directory }).status, 0);
});

test('tarball npm inclui todos os recursos e funciona fora do repositorio', { skip: !process.env.npm_execpath }, context => {
  const directory = mkdtempSync(path.join(tmpdir(), 'rataria-pack-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const cache = path.join(directory, 'cache');
  const consumer = path.join(directory, 'consumer');
  mkdirSync(consumer);
  const npm = args => spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_cache: cache, npm_config_update_notifier: 'false' } });
  const packed = npm(['pack', '--json', '--offline', '--pack-destination', directory]);
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const manifest = JSON.parse(packed.stdout)[0];
  const paths = new Set(manifest.files.map(file => file.path));
  for (const filename of ['package.json', 'LICENSE', 'cli/rataria.mjs', 'lib/installer.mjs', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) assert.equal(paths.has(filename), true, filename);
  function verifyResources(relative) {
    for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const filename = `${relative}/${entry.name}`;
      if (entry.isDirectory()) verifyResources(filename);
      else assert.equal(paths.has(filename), true, filename);
    }
  }
  verifyResources('skills/rataria');
  assert.equal([...paths].some(filename => /^(tests|docs|\.git)\//.test(filename)), false);
  const tarball = path.join(directory, manifest.filename);
  const invoke = action => spawnSync(process.execPath, [process.env.npm_execpath, 'exec', '--offline', '--yes', '--ignore-scripts', '--package', tarball, '--', 'rataria', action, '--client', 'copilot', '--project', consumer, '--json'], { cwd: consumer, encoding: 'utf8', env: { ...process.env, npm_config_cache: cache, npm_config_update_notifier: 'false' } });
  const installed = invoke('install');
  assert.equal(installed.status, 0, installed.stderr || installed.stdout);
  const destination = path.join(consumer, '.github', 'skills', 'rataria');
  assert.deepEqual(readFileSync(path.join(destination, 'SKILL.md')), readFileSync(path.join(root, 'skills', 'rataria', 'SKILL.md')));
  assert.equal(json(path.join(destination, '.rataria-install.json')).version, json(path.join(root, 'package.json')).version);
  const removed = invoke('uninstall');
  assert.equal(removed.status, 0, removed.stderr || removed.stdout);
  assert.equal(existsSync(destination), false);
});