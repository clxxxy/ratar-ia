import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = filename => JSON.parse(readFileSync(path.join(root, filename), 'utf8'));

try {
  const mode = process.argv[2] || 'check';
  const flags = process.argv.slice(3);
  assert.ok(['check', 'sync'].includes(mode) && flags.every(flag => flag === '--quiet'), 'Uso: node scripts/distribution.mjs check|sync [--quiet]');
  const metadata = read('package.json');
  const plugin = read('.claude-plugin/plugin.json');
  const marketplace = read('.claude-plugin/marketplace.json');
  assert.equal(metadata.name, 'ratar-ia', 'Nome do pacote inesperado.');
  assert.match(metadata.version, /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/, 'Versao do pacote invalida.');
  assert.equal(plugin.name, 'rataria', 'Nome do plugin inesperado.');
  assert.ok(typeof plugin.description === 'string' && plugin.description.length > 0, 'Descricao do plugin ausente.');
  assert.ok(typeof plugin.author?.name === 'string' && plugin.author.name.length > 0, 'Autor do plugin ausente.');
  assert.equal(marketplace.name, 'clxxxy-rataria', 'Nome do marketplace inesperado.');
  assert.ok(typeof marketplace.owner?.name === 'string' && marketplace.owner.name.length > 0, 'Responsavel pelo marketplace ausente.');
  assert.equal(marketplace.plugins?.length, 1, 'O catalogo deve distribuir o plugin unico da skill.');
  assert.equal(marketplace.plugins[0].name, plugin.name, 'Nome do catalogo diverge do plugin.');
  assert.equal(marketplace.plugins[0].source, './', 'O plugin deve reutilizar a raiz deste repositorio.');
  assert.equal(metadata.bin?.rataria, 'cli/rataria.mjs', 'Entrada CLI inesperada.');
  for (const filename of ['cli/rataria.mjs', 'lib/installer.mjs', 'skills/rataria/SKILL.md', 'skills/rataria/references/acervo.md', 'skills/rataria/assets/exemplo-acervo.json', 'skills/rataria/scripts/validar-acervo.mjs']) {
    assert.ok(existsSync(path.join(root, filename)), `Recurso ausente: ${filename}`);
  }
  assert.ok(!plugin.hooks && !plugin.mcpServers && !plugin.commands && !plugin.agents && !plugin.skills, 'O plugin deve usar somente a pasta skills padrao, sem componentes duplicados.');
  if (mode === 'sync') {
    plugin.version = metadata.version;
    writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), `${JSON.stringify(plugin, null, 2)}\n`);
  }
  assert.equal(plugin.version, metadata.version, 'Versao do plugin diverge do pacote; execute npm run sync:version.');
  if (!flags.includes('--quiet')) process.stdout.write(`Distribuicao verificada: ${metadata.version}.\n`);
} catch (error) {
  process.stderr.write(`Distribuicao: ${error.message}\n`);
  process.exitCode = 1;
}