#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { manageSkill } from '../lib/installer.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const help = `RatarIA ${metadata.version}

Uso: rataria <install|update|uninstall> --client <cliente> [opcoes]

Clientes: copilot, claude, codex, agents
  --scope project|user  Projeto atual (padrao) ou perfil pessoal
  --project <pasta>     Projeto de destino; somente com escopo project
  --dry-run            Confere a operacao sem alterar arquivos
  --json               Resultado estruturado
  --version            Versao deste pacote
  --help               Esta ajuda

update instala a versao deste pacote. Para receber uma versao nova,
execute npx ratar-ia@latest update com o mesmo cliente e escopo.
Arquivos locais modificados nunca sao sobrescritos automaticamente.
`;

try {
  const { values, positionals } = parseArgs({
    options: {
      client: { type: 'string' },
      scope: { type: 'string', default: 'project' },
      project: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    allowPositionals: true,
    strict: true,
  });
  if (values.help || process.argv.length === 2) {
    process.stdout.write(help);
  } else if (values.version) {
    process.stdout.write(`${metadata.version}\n`);
  } else {
    if (positionals.length !== 1) throw new Error('Informe exatamente uma acao: install, update ou uninstall.');
    if (!values.client) throw new Error('Escolha o cliente com --client copilot|claude|codex|agents.');
    if (values.scope === 'user' && values.project) throw new Error('--project nao pode ser combinado com --scope user.');
    const result = await manageSkill({
      action: positionals[0], client: values.client, scope: values.scope,
      project: values.project || process.cwd(), packageRoot, dryRun: values['dry-run'],
    });
    if (values.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else {
      const labels = { install: 'Instalacao', update: 'Atualizacao', uninstall: 'Remocao' };
      process.stdout.write(`${result.dryRun ? 'Simulacao' : labels[result.action]}: ${result.destination}\nVersao: ${result.version}\n`);
      if (!result.dryRun && result.action !== 'uninstall') process.stdout.write('Recarregue o cliente ou inicie uma nova sessao para conferir a skill.\n');
      for (const warning of result.warnings) process.stdout.write(`Aviso: ${warning}\n`);
    }
  }
} catch (error) {
  process.stderr.write(`RatarIA: ${error.message}\n`);
  process.exitCode = 1;
}