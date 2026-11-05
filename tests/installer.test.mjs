import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'cli', 'rataria.mjs');
const marker = '.rataria-install.json';

async function setup(context) {
  const directory = mkdtempSync(path.join(tmpdir(), 'rataria-installer-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const project = path.join(directory, 'projeto com espacos');
  const home = path.join(directory, 'perfil');
  const packageRoot = path.join(directory, 'package');
  for (const filename of [project, home, packageRoot]) mkdirSync(filename, { recursive: true });
  cpSync(path.join(root, 'skills'), path.join(packageRoot, 'skills'), { recursive: true });
  writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: 'ratar-ia', version: '0.1.0' }));
  const { manageSkill, resolveDestination } = await import('../lib/installer.mjs');
  const options = { client: 'copilot', scope: 'project', project, home, packageRoot };
  return { directory, project, home, packageRoot, options, manageSkill, resolveDestination };
}

test('CLI ajuda e versao nao exigem cliente nem alteram o projeto', () => {
  const help = spawnSync(process.execPath, [cli, '--help'], { cwd: root, encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /install.*update.*uninstall/s);
  const version = spawnSync(process.execPath, [cli, '--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test('resolve projeto e perfil nos diretorios nativos de cada cliente', async context => {
  const fixture = await setup(context);
  const expected = {
    copilot: ['.github', '.copilot'],
    claude: ['.claude', '.claude'],
    codex: ['.agents', '.agents'],
    agents: ['.agents', '.agents'],
  };
  for (const [client, [local, personal]] of Object.entries(expected)) {
    assert.equal(fixture.resolveDestination({ ...fixture.options, client }), path.join(fixture.project, local, 'skills', 'rataria'));
    assert.equal(fixture.resolveDestination({ ...fixture.options, client, scope: 'user' }), path.join(fixture.home, personal, 'skills', 'rataria'));
  }
});

test('instala todos os recursos e registra versao e hashes', async context => {
  const fixture = await setup(context);
  const result = await fixture.manageSkill({ ...fixture.options, action: 'install' });
  assert.equal(result.version, '0.1.0');
  const destination = fixture.resolveDestination(fixture.options);
  for (const filename of ['SKILL.md', 'references/metodo.md', 'assets/exemplo-acervo.json', 'scripts/validar-acervo.mjs']) {
    assert.deepEqual(readFileSync(path.join(destination, filename)), readFileSync(path.join(fixture.packageRoot, 'skills', 'rataria', filename)));
  }
  const receipt = JSON.parse(readFileSync(path.join(destination, marker), 'utf8'));
  assert.equal(receipt.package, 'ratar-ia');
  assert.equal(receipt.version, '0.1.0');
  assert.match(receipt.files['SKILL.md'], /^[a-f0-9]{64}$/);
});

test('dry-run nao cria destinos, marcadores ou pastas de cliente', async context => {
  const fixture = await setup(context);
  const result = await fixture.manageSkill({ ...fixture.options, action: 'install', dryRun: true });
  assert.equal(result.dryRun, true);
  assert.equal(existsSync(path.join(fixture.project, '.github')), false);
});

test('nao assume posse de instalacao manual nem sobrescreve arquivos locais', async context => {
  const fixture = await setup(context);
  const destination = fixture.resolveDestination(fixture.options);
  mkdirSync(destination, { recursive: true });
  writeFileSync(path.join(destination, 'SKILL.md'), 'minha versao');
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'install' }), /gerenciada|existente/i);
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'uninstall' }), /gerenciada/i);
  assert.equal(readFileSync(path.join(destination, 'SKILL.md'), 'utf8'), 'minha versao');
});

test('atualiza versao escolhida e remove apenas recursos antigos gerenciados', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  writeFileSync(path.join(destination, 'minhas-notas.md'), 'preservar');
  writeFileSync(path.join(fixture.packageRoot, 'package.json'), JSON.stringify({ name: 'ratar-ia', version: '0.2.0' }));
  const source = path.join(fixture.packageRoot, 'skills', 'rataria');
  writeFileSync(path.join(source, 'SKILL.md'), 'nova versao');
  rmSync(path.join(source, 'assets', 'exemplo-acervo.json'));
  const result = await fixture.manageSkill({ ...fixture.options, action: 'update' });
  assert.equal(result.version, '0.2.0');
  assert.equal(readFileSync(path.join(destination, 'SKILL.md'), 'utf8'), 'nova versao');
  assert.equal(existsSync(path.join(destination, 'assets', 'exemplo-acervo.json')), false);
  assert.equal(readFileSync(path.join(destination, 'minhas-notas.md'), 'utf8'), 'preservar');
});

test('update e uninstall recusam alteracoes e exclusoes locais antes de mudar qualquer arquivo', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const original = readFileSync(path.join(destination, marker), 'utf8');
  writeFileSync(path.join(destination, 'SKILL.md'), 'edicao local');
  for (const action of ['update', 'uninstall']) {
    await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action }), /local|modificad|conflito/i);
    assert.equal(readFileSync(path.join(destination, marker), 'utf8'), original);
    assert.equal(readFileSync(path.join(destination, 'SKILL.md'), 'utf8'), 'edicao local');
  }
  cpSync(path.join(fixture.packageRoot, 'skills', 'rataria', 'SKILL.md'), path.join(destination, 'SKILL.md'));
  rmSync(path.join(destination, 'references', 'metodo.md'));
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /local|ausente|conflito/i);
});

test('uninstall preserva arquivos extras, outras skills e configuracoes do cliente', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const other = path.join(fixture.project, '.github', 'skills', 'outra');
  mkdirSync(other);
  writeFileSync(path.join(other, 'SKILL.md'), 'outra skill');
  writeFileSync(path.join(destination, 'notas.md'), 'minhas notas');
  await fixture.manageSkill({ ...fixture.options, action: 'uninstall' });
  assert.equal(existsSync(path.join(destination, 'SKILL.md')), false);
  assert.equal(existsSync(path.join(destination, marker)), false);
  assert.equal(readFileSync(path.join(destination, 'notas.md'), 'utf8'), 'minhas notas');
  assert.equal(readFileSync(path.join(other, 'SKILL.md'), 'utf8'), 'outra skill');
});

test('nao permite que a fonte nova capture um arquivo extra do usuario', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  writeFileSync(path.join(destination, 'meu.md'), 'meu arquivo');
  writeFileSync(path.join(fixture.packageRoot, 'skills', 'rataria', 'meu.md'), 'recurso novo');
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /local|conflito|existente/i);
  assert.equal(readFileSync(path.join(destination, 'meu.md'), 'utf8'), 'meu arquivo');
});

test('marcador adulterado nao autoriza caminhos fora da skill', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const receipt = JSON.parse(readFileSync(path.join(destination, marker), 'utf8'));
  receipt.files['../../fora.txt'] = '0'.repeat(64);
  writeFileSync(path.join(destination, marker), JSON.stringify(receipt));
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'uninstall' }), /marcador|caminho/i);
  assert.equal(existsSync(path.join(destination, 'SKILL.md')), true);
});

test('recusa junction no destino e nao altera a pasta apontada', async context => {
  const fixture = await setup(context);
  const outside = path.join(fixture.directory, 'externo');
  mkdirSync(outside);
  const destination = fixture.resolveDestination(fixture.options);
  mkdirSync(path.dirname(destination), { recursive: true });
  symlinkSync(outside, destination, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(lstatSync(destination).isSymbolicLink(), true);
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'install' }), /link|junction/i);
  assert.deepEqual(readdirSync(outside), []);
});

test('recusa junction em ancestral do destino', async context => {
  const fixture = await setup(context);
  const outside = path.join(fixture.directory, 'externo');
  mkdirSync(outside);
  symlinkSync(outside, path.join(fixture.project, '.github'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'install' }), /link|junction/i);
  assert.deepEqual(readdirSync(outside), []);
});

test('parametros invalidos falham antes de criar qualquer instalacao', async context => {
  const fixture = await setup(context);
  for (const override of [{ client: 'desconhecido' }, { scope: 'global' }, { action: 'destruir' }]) {
    await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'install', ...override }));
  }
  assert.deepEqual(readdirSync(fixture.project), []);
  const result = spawnSync(process.execPath, [cli, 'install', '--force'], { cwd: fixture.project, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.deepEqual(readdirSync(fixture.project), []);
});

test('update exige instalacao gerenciada anterior', async context => {
  const fixture = await setup(context);
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /instalad|existente|gerenciada/i);
  assert.deepEqual(readdirSync(fixture.project), []);
});

test('uninstall preserva pastas vazias extras criadas pelo usuario', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const notes = path.join(destination, 'minha-pasta-vazia');
  mkdirSync(notes);
  await fixture.manageSkill({ ...fixture.options, action: 'uninstall' });
  assert.equal(existsSync(notes), true);
  assert.deepEqual(readdirSync(notes), []);
});

test('recurso novo nao captura arquivo local por diferenca de maiusculas', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  writeFileSync(path.join(destination, 'NOTAS.md'), 'meu arquivo');
  writeFileSync(path.join(fixture.packageRoot, 'skills', 'rataria', 'notas.md'), 'recurso novo');
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /conflito|local/i);
  assert.equal(readFileSync(path.join(destination, 'NOTAS.md'), 'utf8'), 'meu arquivo');
});

test('trava existente interrompe operacao sem remover a trava alheia', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const lock = path.join(path.dirname(destination), '.rataria-install.lock');
  writeFileSync(lock, 'outra operacao');
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /trava|operacao/i);
  assert.equal(readFileSync(lock, 'utf8'), 'outra operacao');
  assert.equal(existsSync(path.join(destination, 'SKILL.md')), true);
});

test('update nao assume posse de pasta vazia preexistente para recurso novo', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  mkdirSync(path.join(destination, 'notas'));
  const newDirectory = path.join(fixture.packageRoot, 'skills', 'rataria', 'notas');
  mkdirSync(newDirectory);
  writeFileSync(path.join(newDirectory, 'recurso.md'), 'novo recurso');
  await fixture.manageSkill({ ...fixture.options, action: 'update' });
  await fixture.manageSkill({ ...fixture.options, action: 'uninstall' });
  assert.equal(existsSync(path.join(destination, 'notas')), true);
  assert.deepEqual(readdirSync(path.join(destination, 'notas')), []);
});

test('duas invocacoes reais nao sobrescrevem nem removem artefatos uma da outra', async context => {
  const fixture = await setup(context);
  const invoke = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'install', '--client', 'copilot', '--project', fixture.project, '--json']);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
  const results = await Promise.all([invoke(), invoke()]);
  assert.deepEqual(results.map(result => result.status).sort(), [0, 1], JSON.stringify(results));
  const destination = fixture.resolveDestination(fixture.options);
  assert.deepEqual(readFileSync(path.join(destination, 'SKILL.md')), readFileSync(path.join(root, 'skills', 'rataria', 'SKILL.md')));
  assert.equal(readdirSync(path.dirname(destination)).some(name => /^\.rataria-(stage|backup|install)/.test(name)), false);
});

test('falha ao promover staging restaura integralmente a instalacao anterior', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const receipt = readFileSync(path.join(destination, marker));
  const skill = readFileSync(path.join(destination, 'SKILL.md'));
  const rename = fs.renameSync;
  const mocked = context.mock.method(fs, 'renameSync', (from, to) => {
    if (path.basename(from).startsWith('.rataria-stage-')) throw new Error('Falha simulada na promocao');
    return rename(from, to);
  });
  syncBuiltinESMExports();
  context.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /promocao/);
  assert.deepEqual(readFileSync(path.join(destination, marker)), receipt);
  assert.deepEqual(readFileSync(path.join(destination, 'SKILL.md')), skill);
  assert.equal(readdirSync(path.dirname(destination)).some(name => /^\.rataria-(stage|backup|install)/.test(name)), false);
});

test('falha de rollback preserva backup e informa onde recuperar', async context => {
  const fixture = await setup(context);
  await fixture.manageSkill({ ...fixture.options, action: 'install' });
  const destination = fixture.resolveDestination(fixture.options);
  const before = readFileSync(path.join(destination, 'SKILL.md'));
  const rename = fs.renameSync;
  const mocked = context.mock.method(fs, 'renameSync', (from, to) => {
    if (/^\.rataria-(stage|backup)-/.test(path.basename(from))) throw new Error('Falha simulada');
    return rename(from, to);
  });
  syncBuiltinESMExports();
  context.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  await assert.rejects(() => fixture.manageSkill({ ...fixture.options, action: 'update' }), /backup preservado em/i);
  const backup = readdirSync(path.dirname(destination)).find(name => name.startsWith('.rataria-backup-'));
  assert.ok(backup);
  assert.deepEqual(readFileSync(path.join(path.dirname(destination), backup, 'SKILL.md')), before);
});