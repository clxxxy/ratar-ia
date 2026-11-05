import { createHash, randomUUID } from 'node:crypto';
import { closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultPackageRoot = fileURLToPath(new URL('../', import.meta.url));
const marker = '.rataria-install.json';
const clients = {
  copilot: { project: '.github', user: '.copilot' },
  claude: { project: '.claude', user: '.claude' },
  codex: { project: '.agents', user: '.agents' },
  agents: { project: '.agents', user: '.agents' },
};
const hash = content => createHash('sha256').update(content).digest('hex');
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function resolveDestination({ client, scope = 'project', project = process.cwd(), home = homedir() }) {
  if (!Object.hasOwn(clients, client)) throw new Error('Cliente invalido: use copilot, claude, codex ou agents.');
  if (!['project', 'user'].includes(scope)) throw new Error('Escopo invalido: use project ou user.');
  const base = scope === 'user' ? home : project;
  return path.resolve(base, clients[client][scope], 'skills', 'rataria');
}

function assertNoLinks(filename) {
  let current = path.resolve(filename);
  while (true) {
    let stat;
    try { stat = lstatSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat?.isSymbolicLink()) throw new Error(`Link simbolico/junction nao permitido: ${current}`);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function collectFiles(directory, directories = new Set()) {
  const files = new Map();
  function visit(current, relative = '') {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name);
      const key = relative ? `${relative}/${entry.name}` : entry.name;
      const stat = lstatSync(filename);
      if (stat.isSymbolicLink()) throw new Error(`Link simbolico/junction nao permitido: ${filename}`);
      if (stat.isDirectory()) { directories.add(key); visit(filename, key); }
      else if (stat.isFile()) files.set(key, hash(readFileSync(filename)));
      else throw new Error(`Tipo de arquivo nao permitido: ${filename}`);
    }
  }
  visit(directory);
  return files;
}

function safeRelative(filename) {
  return typeof filename === 'string' && filename.length > 0 && !/[\\:]/.test(filename) && !filename.startsWith('/') && filename.split('/').every(part => part && part !== '.' && part !== '..') && filename.toLowerCase() !== marker;
}

function readReceipt(destination) {
  let receipt;
  try { receipt = JSON.parse(readFileSync(path.join(destination, marker), 'utf8')); }
  catch { throw new Error('Instalacao nao gerenciada ou marcador invalido; nenhum arquivo foi alterado.'); }
  if (!isObject(receipt) || receipt.schema_version !== 1 || receipt.package !== 'ratar-ia' || receipt.skill !== 'rataria' || typeof receipt.version !== 'string' || !isObject(receipt.files) || !Object.hasOwn(receipt.files, 'SKILL.md')) {
    throw new Error('Marcador de instalacao invalido.');
  }
  for (const [filename, digest] of Object.entries(receipt.files)) {
    if (!safeRelative(filename) || typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('Marcador contem caminho ou hash invalido.');
  }
  if (receipt.directories !== undefined && (!Array.isArray(receipt.directories) || !receipt.directories.every(safeRelative))) throw new Error('Marcador contem diretorios invalidos.');
  return receipt;
}

function assertPristine(receipt, actual) {
  for (const [filename, digest] of Object.entries(receipt.files)) {
    if (actual.get(filename) !== digest) throw new Error(`Conflito local: arquivo modificado ou ausente (${filename}). Preserve sua edicao antes de continuar.`);
  }
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function pruneManagedEmpty(directory, directories) {
  for (const relative of [...directories].sort((first, second) => second.length - first.length)) {
    const candidate = path.join(directory, relative);
    if (existsSync(candidate) && readdirSync(candidate).length === 0) rmdirSync(candidate);
  }
  if (readdirSync(directory).length === 0) rmdirSync(directory);
}

export async function manageSkill({ action, client, scope = 'project', project = process.cwd(), home = homedir(), packageRoot = defaultPackageRoot, dryRun = false }) {
  if (!['install', 'update', 'uninstall'].includes(action)) throw new Error('Acao invalida: use install, update ou uninstall.');
  const destination = resolveDestination({ client, scope, project, home });
  const source = path.resolve(packageRoot, 'skills', 'rataria');
  assertNoLinks(destination);
  assertNoLinks(source);
  if (contains(source, destination) || contains(destination, source)) throw new Error('Fonte e destino da skill nao podem se sobrepor.');
  const metadata = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  if (metadata.name !== 'ratar-ia' || typeof metadata.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(metadata.version)) throw new Error('Pacote ou versao invalida.');
  const payloadDirectories = new Set();
  const payload = action === 'uninstall' ? new Map() : collectFiles(source, payloadDirectories);
  if (action !== 'uninstall' && !payload.has('SKILL.md')) throw new Error('Pacote incompleto: SKILL.md ausente.');
  for (const filename of payload.keys()) if (!safeRelative(filename)) throw new Error('Pacote contem caminho reservado ou invalido.');
  const portableKey = filename => filename.normalize('NFC').toLowerCase();
  if (new Set([...payload.keys()].map(portableKey)).size !== payload.size) throw new Error('Pacote contem caminhos conflitantes por maiusculas ou normalizacao.');

  const present = existsSync(destination);
  let receipt = null;
  let original = new Map();
  const originalDirectories = new Set();
  if (present) {
    if (!lstatSync(destination).isDirectory()) throw new Error('Destino existente nao e uma pasta de skill gerenciada.');
    original = collectFiles(destination, originalDirectories);
    receipt = readReceipt(destination);
    assertPristine(receipt, original);
    if (action === 'install') throw new Error('Skill ja instalada e gerenciada; use update para mudar a versao.');
  } else if (action !== 'install') {
    throw new Error('Skill nao instalada neste destino; use install primeiro.');
  }
  const existingKeys = new Map([...original.keys()].map(filename => [portableKey(filename), filename]));
  for (const filename of payload.keys()) {
    const existing = existingKeys.get(portableKey(filename));
    if (existing && !Object.hasOwn(receipt.files, existing)) throw new Error(`Conflito local com recurso novo: ${filename}`);
  }
  const ownedDirectories = new Set(receipt?.directories || []);
  const existingDirectories = new Set([...originalDirectories].map(portableKey));
  for (const directory of payloadDirectories) {
    if (!existingDirectories.has(portableKey(directory))) ownedDirectories.add(directory);
  }
  const result = { action, client, scope, destination, version: action === 'uninstall' ? receipt.version : metadata.version, dryRun, warnings: [] };
  if (dryRun) return result;

  const parent = path.dirname(destination);
  mkdirSync(parent, { recursive: true });
  assertNoLinks(parent);
  const lockPath = path.join(parent, '.rataria-install.lock');
  let lock;
  try { lock = openSync(lockPath, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Outra operacao ou trava anterior existe em .rataria-install.lock; confira antes de tentar novamente.');
    throw error;
  }
  let stage;
  let backup;
  try {
    stage = mkdtempSync(path.join(parent, '.rataria-stage-'));
    if (present) cpSync(destination, stage, { recursive: true, dereference: false });
    if (receipt) {
      for (const filename of Object.keys(receipt.files)) {
        if (!payload.has(filename)) rmSync(path.join(stage, filename));
      }
    }
    for (const directory of payloadDirectories) mkdirSync(path.join(stage, directory), { recursive: true });
    for (const filename of payload.keys()) {
      const target = path.join(stage, filename);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(path.join(source, filename), target);
      if (hash(readFileSync(target)) !== payload.get(filename)) throw new Error('Fonte mudou durante a copia; operacao cancelada.');
    }
    if (action === 'uninstall') {
      rmSync(path.join(stage, marker));
    } else {
      const nextReceipt = { schema_version: 1, package: metadata.name, skill: 'rataria', version: metadata.version, installed_at: new Date().toISOString(), files: Object.fromEntries(payload), directories: [...ownedDirectories] };
      writeFileSync(path.join(stage, marker), `${JSON.stringify(nextReceipt, null, 2)}\n`);
    }

    assertNoLinks(destination);
    if (present) {
      const currentDirectories = new Set();
      const current = collectFiles(destination, currentDirectories);
      if (current.size !== original.size || [...current].some(([filename, digest]) => original.get(filename) !== digest) || currentDirectories.size !== originalDirectories.size || [...currentDirectories].some(directory => !originalDirectories.has(directory))) throw new Error('Destino mudou durante a operacao; nenhum arquivo local foi substituido.');
      backup = path.join(parent, `.rataria-backup-${randomUUID()}`);
      renameSync(destination, backup);
    } else if (existsSync(destination)) {
      throw new Error('Destino foi criado por outra operacao; instalacao cancelada.');
    }
    try { renameSync(stage, destination); stage = null; }
    catch (error) {
      if (backup) {
        try { renameSync(backup, destination); backup = null; }
        catch (restoreError) { throw new Error(`Falha na restauracao; backup preservado em ${backup}. Recupere essa pasta antes de repetir a operacao.`, { cause: restoreError }); }
      }
      throw error;
    }
    if (backup) {
      try { rmSync(backup, { recursive: true }); backup = null; }
      catch { result.warnings.push(`Instalacao concluida, mas backup preservado em ${backup}.`); }
    }
    if (action === 'uninstall') pruneManagedEmpty(destination, receipt.directories || []);
    return result;
  } finally {
    if (stage) rmSync(stage, { recursive: true, force: true });
    closeSync(lock);
    unlinkSync(lockPath);
  }
}