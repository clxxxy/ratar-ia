import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const validator = fileURLToPath(new URL('../skills/rataria/scripts/validar-acervo.mjs', import.meta.url));

function sample() {
  return {
    schema_version: 1,
    manifest: {
      run_id: 'atlas-20261104',
      target: { name: 'Atlas', organization: 'Oficina', edition: 'Cloud', version: '2026', region: 'BR', aliases: [], excluded: ['Atlas CRM'] },
      objective: 'acervo',
      status: 'parcial',
      started_at: '2026-11-04T10:00:00Z',
      updated_at: '2026-11-04T10:05:00Z',
      budget: { limit: 'uma rodada', used: 'uma rodada sintetica' },
      tools: { search: false, browser: false, subagents: false, persistence: true },
      stop_reason: 'orcamento',
      report_files: [],
    },
    sources: [{ id: 'S1', url: 'https://example.invalid/docs', title: 'Manual', origin: 'Oficina', type: 'oficial', published_at: null, accessed_at: '2026-11-04', access: 'lida', derived_from: null }],
    evidence: [{ id: 'E1', source_id: 'S1', locator: 'Exportacao', text: 'Exporta CSV.', kind: 'citacao', collected_at: '2026-11-04' }],
    claims: [{ id: 'C1', text: 'O manual documenta CSV.', class: 'documentado', evidence_ids: ['E1'], topic_ids: ['T1'], limitations: 'Sem teste operacional.' }],
    frontier: [{ id: 'F1', question: 'Ler limites do PDF', source_ids: ['S1'], topic_id: 'T2', status: 'pendente', reason: 'Orcamento encerrado.', depends_on: [] }],
    queries: [{ id: 'Q1', topic_id: 'T1', query: 'Leitura do manual fornecido', tool: 'leitura-local', status: 'executada', executed_at: '2026-11-04', source_ids: ['S1'], new_evidence_ids: ['E1'], round: 'R1' }],
    coverage: [
      { id: 'T1', label: 'Exportacao', essential: true, status: 'coberto', source_ids: ['S1'], gap: '', closure: { reason: 'universo_finito', query_ids: ['Q1'], rounds_without_new: 0 } },
      { id: 'T2', label: 'Limites', essential: true, status: 'nao_explorado', source_ids: [], gap: 'PDF pendente.', closure: null },
    ],
    audit: { status: 'pendente', reviewed_by: null, findings: ['PDF ainda nao examinado.'] },
  };
}

function run(acervo) {
  const directory = mkdtempSync(path.join(tmpdir(), 'rataria-test-'));
  try {
    const filename = path.join(directory, 'acervo.json');
    writeFileSync(filename, typeof acervo === 'string' ? acervo : JSON.stringify(acervo));
    const result = spawnSync(process.execPath, [validator, filename], { encoding: 'utf8' });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('aceita acervo parcial e conta paginas lidas sem contar lacunas como cobertura', () => {
  const result = run(sample());
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.valid, true);
  assert.deepEqual(output.counts.sources, { total: 1, read: 1, partial: 0, unread: 0 });
  assert.deepEqual(output.counts.coverage, { total: 2, covered: 1, unresolved: 1, not_applicable: 0 });
  assert.equal(output.counts.frontier_open, 1);
  assert.match(output.notice, /nao.*verdade/i);
});

test('rejeita referencia quebrada entre afirmacao e evidencia', () => {
  const data = sample();
  data.claims[0].evidence_ids = ['E404'];
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /E404/);
});

test('rejeita IDs duplicados e afirmacao sem suporte semantico declarado', () => {
  const data = sample();
  data.sources.push({ ...data.sources[0] });
  data.claims[0].evidence_ids = [];
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /duplicado/);
  assert.match(result.stdout, /evidence_ids/);
});

test('permite nao confirmado sem evidencia mas exige limitacao', () => {
  const data = sample();
  data.claims[0].class = 'nao_confirmado';
  data.claims[0].evidence_ids = [];
  assert.equal(run(data).status, 0);
  data.claims[0].limitations = '';
  assert.equal(run(data).status, 1);
});

test('nao deixa snippet sustentar afirmacao documentada como leitura da fonte', () => {
  const data = sample();
  data.sources[0].access = 'snippet';
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /snippet/);
});

test('deduplica rastreamento e fragmento mas preserva parametros de paginacao', () => {
  const data = sample();
  data.sources.push({ ...data.sources[0], id: 'S2', url: 'https://example.invalid/docs?utm_source=blog#csv' });
  let result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /URL.*duplicada/);
  data.sources[0].url = 'https://example.invalid/api?page=1';
  data.sources[1].url = 'https://example.invalid/api?page=2';
  assert.equal(run(data).status, 0);
});

test('republicacao de uma origem nao vira segunda fonte independente', () => {
  const data = sample();
  data.sources.push({ ...data.sources[0], id: 'S2', url: 'https://blog.invalid/republicacao', derived_from: 'S1' });
  const result = run(data);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).counts.origin_groups, 1);
  data.sources[0].derived_from = 'S2';
  assert.equal(run(data).status, 1);
});

test('rejeita concluido com pendencias e auditoria ausente', () => {
  const data = sample();
  data.manifest.status = 'concluido_no_recorte';
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /concluido_no_recorte/);
});

test('aceita universo finito concluido e nao exige duas buscas artificiais', () => {
  const data = sample();
  data.manifest.status = 'concluido_no_recorte';
  data.manifest.stop_reason = 'universo_finito';
  data.coverage = [data.coverage[0]];
  data.frontier = [];
  data.audit = { status: 'revisado', reviewed_by: 'revisao sequencial declarada', findings: [] };
  assert.equal(run(data).status, 0);
});

test('saturacao exige consultas executadas de duas rodadas sem novidade', () => {
  const data = sample();
  data.coverage[0].closure = { reason: 'saturacao', query_ids: ['Q1'], rounds_without_new: 2 };
  assert.equal(run(data).status, 1);
  data.queries[0].new_evidence_ids = [];
  data.queries.push({ ...data.queries[0], id: 'Q2', round: 'R2', query: 'Atlas CSV restricoes' });
  data.coverage[0].closure.query_ids.push('Q2');
  assert.equal(run(data).status, 0);
});

test('trata campos malformados como erros de contrato e nao encerra com stack trace', () => {
  for (const data of [null, [], {}, { ...sample(), sources: null }, { ...sample(), claims: [null] }]) {
    const result = run(data);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).valid, false);
    assert.equal(result.stderr, '');
  }
});

test('JSON invalido e arquivo ausente retornam erro de entrada distinto', () => {
  const result = run('{invalido');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /entrada/i);
  const missing = spawnSync(process.execPath, [validator, 'rataria-arquivo-inexistente.json'], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
});

test('campos internos malformados sao erros de contrato, inclusive na saturacao', () => {
  const data = sample();
  data.coverage[0].closure = { reason: 'saturacao', query_ids: null, rounds_without_new: 2 };
  data.queries[0].new_evidence_ids = [];
  data.queries.push({ ...data.queries[0], id: 'Q2', round: 'R2' });
  const result = run(data);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, false);
});

test('coberto exige ao menos evidencia de fonte examinada, nao apenas URL catalogada', () => {
  const data = sample();
  data.claims = [];
  data.evidence = [];
  data.queries[0].new_evidence_ids = [];
  data.sources[0].access = 'catalogada';
  assert.equal(run(data).status, 1);
});

test('rejeita ciclos na fila e na sucessao de afirmacoes', () => {
  const data = sample();
  data.frontier[0].depends_on = ['F1'];
  data.claims[0].supersedes = 'C1';
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /ciclo.*depends_on/);
  assert.match(result.stdout, /ciclo.*supersedes/);
});

test('rejeita data impossivel e URL com credencial sem acessar rede', () => {
  const data = sample();
  data.sources[0].accessed_at = '2026-02-30';
  data.sources[0].url = 'https://usuario:exemplo@example.invalid/docs';
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /data ISO/);
  assert.match(result.stdout, /credenciais/);
});

test('nova evidencia depois das rodadas vazias impede usar saturacao antiga', () => {
  const data = sample();
  data.queries[0].new_evidence_ids = [];
  data.queries.push({ ...data.queries[0], id: 'Q2', round: 'R2' });
  data.queries.push({ ...data.queries[0], id: 'Q3', round: 'R3', new_evidence_ids: ['E1'] });
  data.coverage[0].closure = { reason: 'saturacao', query_ids: ['Q1', 'Q2'], rounds_without_new: 2 };
  assert.equal(run(data).status, 1);
});

test('exemplo distribuido continua aceito pelo validador de verdade', () => {
  const filename = fileURLToPath(new URL('../skills/rataria/assets/exemplo-acervo.json', import.meta.url));
  const result = spawnSync(process.execPath, [validator, filename], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test('uma leitura transversal pode encerrar topicos explicitamente vinculados', () => {
  const data = sample();
  data.queries[0].topic_ids = ['T1', 'T2'];
  data.coverage[1] = { ...data.coverage[0], id: 'T2', label: 'Outro trecho do manual' };
  const result = run(data);
  assert.equal(result.status, 0, result.stdout);
  data.queries[0].topic_ids = ['T1', 'T404'];
  assert.equal(run(data).status, 1);
});

test('encerramento parcial por falta de ferramenta nao exige inventar consulta', () => {
  const data = sample();
  data.coverage[1].closure = { reason: 'sem_ferramentas', query_ids: [], rounds_without_new: 0 };
  assert.equal(run(data).status, 0);
  data.queries.push({ id: 'Q2', topic_id: 'T2', query: 'Extrair PDF', tool: 'extrator', status: 'falhou', error: '403', executed_at: '2026-11-04', source_ids: [], new_evidence_ids: [], round: 'R1' });
  data.coverage[1].closure = { reason: 'bloqueio', query_ids: ['Q2'], rounds_without_new: 0 };
  assert.equal(run(data).status, 0);
});

test('fragmentos que sao rotas de SPA nao colapsam como ancoras', () => {
  const data = sample();
  data.sources[0].url = 'https://example.invalid/#/planos';
  data.sources.push({ ...data.sources[0], id: 'S2', url: 'https://example.invalid/#/seguranca' });
  assert.equal(run(data).status, 0);
});

test('pista concluida exige resultado existente e referencias opcionais sao verificadas', () => {
  const data = sample();
  data.frontier[0].status = 'concluido';
  assert.equal(run(data).status, 1);
  data.frontier[0].claim_ids = ['C404'];
  data.frontier[0].evidence_ids = ['E404'];
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /C404/);
  assert.match(result.stdout, /E404/);
  data.frontier[0].claim_ids = ['C1'];
  data.frontier[0].evidence_ids = ['E1'];
  assert.equal(run(data).status, 0);
});

test('rejeita closure invalido e campos anulaveis obrigatorios ausentes', () => {
  const data = sample();
  data.coverage[1].closure = 'invalido';
  delete data.sources[0].derived_from;
  delete data.audit.reviewed_by;
  const result = run(data);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /closure/);
  assert.match(result.stdout, /derived_from/);
  assert.match(result.stdout, /reviewed_by/);
});

test('acervo produzido pelo agente preserva contrato e lacuna do portal', () => {
  const filename = fileURLToPath(new URL('./fixtures/atlas-acervo.json', import.meta.url));
  const data = JSON.parse(readFileSync(filename, 'utf8'));
  const result = run(data);
  assert.equal(result.status, 0, result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(data.manifest.status, 'parcial');
  assert.equal(output.counts.frontier_open, 1);
  assert.equal(data.frontier.find(item => item.id === 'F10').status, 'bloqueado');
});

test('delta de contexto novo supersede cota antiga sem apagar evidencia ou pendencia', () => {
  const base = JSON.parse(readFileSync(new URL('./fixtures/atlas-acervo.json', import.meta.url), 'utf8'));
  const delta = JSON.parse(readFileSync(new URL('./fixtures/atlas-delta.json', import.meta.url), 'utf8'));
  assert.equal(delta.base_run_id, base.manifest.run_id);
  const oldClaim = structuredClone(base.claims.find(claim => claim.id === 'C15'));
  const oldEvidence = structuredClone(base.evidence.find(evidence => evidence.id === 'E14'));
  assert.equal(delta.claims.length, 1);
  assert.equal(delta.claims[0].supersedes, 'C15');
  assert.deepEqual(delta.remaining_frontier_ids, ['F10']);
  for (const key of ['sources', 'evidence', 'claims', 'queries']) base[key].push(...delta[key]);
  base.manifest.previous_run = base.manifest.run_id;
  base.manifest.run_id = delta.run_id;
  base.manifest.updated_at = delta.date;
  assert.deepEqual(base.claims.find(claim => claim.id === 'C15'), oldClaim);
  assert.deepEqual(base.evidence.find(evidence => evidence.id === 'E14'), oldEvidence);
  const result = run(base);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(base.manifest.status, 'parcial');
  assert.equal(JSON.parse(result.stdout).counts.frontier_open, 1);
});

test('auditoria malformada em entrega concluida continua erro de contrato', () => {
  const data = sample();
  data.manifest.status = 'concluido_no_recorte';
  data.audit = { status: 'revisado', reviewed_by: 'revisor', findings: null };
  const result = run(data);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /audit.findings/);
});