import { readFileSync } from 'node:fs';

const notice = 'Integridade estrutural apenas: este resultado nao comprova verdade, leitura real, independencia das fontes ou exaustividade.';
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const isDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/.test(value)) return false;
  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(Date.parse(value)) && Number.isFinite(parsedDay.getTime()) && parsedDay.toISOString().slice(0, 10) === day;
};

function canonicalUrl(value) {
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('URL deve ser HTTP(S), sem credenciais');
  }
  if (!/^#(?:!?\/|!)/.test(parsed.hash)) parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'msclkid'].includes(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.searchParams.sort();
  return parsed.href;
}

function validate(data) {
  const errors = [];
  const warnings = [];
  const requireValue = (condition, message) => { if (!condition) errors.push(message); };
  const text = (value, label) => requireValue(hasText(value), `${label}: texto obrigatorio`);
  const date = (value, label) => requireValue(isDate(value), `${label}: data ISO obrigatoria`);
  const choice = (value, options, label) => requireValue(options.includes(value), `${label}: valor invalido (${String(value)})`);
  const queryTopics = query => Array.isArray(query.topic_ids) ? query.topic_ids : [query.topic_id];
  const references = (values, index, label, nonempty = false) => {
    if (!Array.isArray(values)) {
      errors.push(`${label}: lista obrigatoria`);
      return;
    }
    if (nonempty && values.length === 0) errors.push(`${label}: ao menos uma referencia obrigatoria`);
    if (new Set(values).size !== values.length) errors.push(`${label}: referencia duplicada`);
    for (const value of values) {
      if (!hasText(value) || !index.has(value)) errors.push(`${label}: referencia inexistente ${String(value)}`);
    }
  };
  const checkCycles = (index, field) => {
    const state = new Map();
    for (const id of index.keys()) {
      const stack = [{ id, exit: false }];
      while (stack.length) {
        const current = stack.pop();
        if (current.exit) { state.set(current.id, 2); continue; }
        if (state.get(current.id) === 2 || !index.has(current.id)) continue;
        if (state.get(current.id) === 1) { errors.push(`${current.id}: ciclo em ${field}`); continue; }
        state.set(current.id, 1);
        stack.push({ id: current.id, exit: true });
        const value = index.get(current.id)[field];
        const nextIds = Array.isArray(value) ? value : hasText(value) ? [value] : [];
        for (const nextId of nextIds) stack.push({ id: nextId, exit: false });
      }
    }
  };

  if (!isObject(data)) return { valid: false, errors: ['Acervo deve ser um objeto JSON.'], warnings, notice };
  requireValue(data.schema_version === 1, 'schema_version: esperado 1');
  const names = ['sources', 'evidence', 'claims', 'frontier', 'queries', 'coverage'];
  const indexes = {};
  for (const name of names) {
    indexes[name] = new Map();
    if (!Array.isArray(data[name])) {
      errors.push(`${name}: lista obrigatoria`);
      continue;
    }
    for (const record of data[name]) {
      if (!isObject(record)) {
        errors.push(`${name}: registro deve ser objeto`);
        continue;
      }
      text(record.id, `${name}.id`);
      if (indexes[name].has(record.id)) errors.push(`${name}: ID duplicado ${record.id}`);
      indexes[name].set(record.id, record);
    }
  }
  if (!isObject(data.manifest)) errors.push('manifest: objeto obrigatorio');
  if (!isObject(data.audit)) errors.push('audit: objeto obrigatorio');
  if (!names.every(name => Array.isArray(data[name]) && data[name].every(isObject)) || !isObject(data.manifest) || !isObject(data.audit)) {
    return { valid: false, errors, warnings, notice };
  }

  const manifest = data.manifest;
  text(manifest.run_id, 'manifest.run_id');
  choice(manifest.objective, ['acervo', 'decisao'], 'manifest.objective');
  choice(manifest.status, ['em_andamento', 'parcial', 'concluido_no_recorte'], 'manifest.status');
  date(manifest.started_at, 'manifest.started_at');
  date(manifest.updated_at, 'manifest.updated_at');
  requireValue(Date.parse(manifest.updated_at) >= Date.parse(manifest.started_at), 'manifest: updated_at anterior a started_at');
  if (!isObject(manifest.target)) {
    errors.push('manifest.target: objeto obrigatorio');
  } else {
    for (const key of ['name', 'organization', 'edition', 'version', 'region']) text(manifest.target[key], `manifest.target.${key}`);
    for (const key of ['aliases', 'excluded']) {
      requireValue(Array.isArray(manifest.target[key]) && manifest.target[key].every(hasText), `manifest.target.${key}: lista de textos obrigatoria`);
    }
  }
  requireValue(isObject(manifest.budget) && hasText(manifest.budget.limit) && hasText(manifest.budget.used), 'manifest.budget: limit e used obrigatorios');
  requireValue(isObject(manifest.tools) && ['search', 'browser', 'subagents', 'persistence'].every(key => typeof manifest.tools[key] === 'boolean'), 'manifest.tools: capacidades booleanas obrigatorias');
  requireValue(Array.isArray(manifest.report_files) && manifest.report_files.every(hasText), 'manifest.report_files: lista de caminhos obrigatoria');
  if (manifest.status !== 'em_andamento') choice(manifest.stop_reason, ['saturacao', 'universo_finito', 'orcamento', 'prazo', 'bloqueio', 'sem_ferramentas'], 'manifest.stop_reason');

  const urls = new Map();
  for (const source of data.sources) {
    const label = `sources.${source.id}`;
    for (const key of ['title', 'origin', 'type']) text(source[key], `${label}.${key}`);
    choice(source.access, ['lida', 'parcial', 'catalogada', 'snippet', 'bloqueada', 'indisponivel'], `${label}.access`);
    date(source.accessed_at, `${label}.accessed_at`);
    if (source.published_at !== null) date(source.published_at, `${label}.published_at`);
    requireValue(hasText(source.url) || hasText(source.file), `${label}: url ou file obrigatorio`);
    if (hasText(source.url)) {
      try {
        const canonical = canonicalUrl(source.url);
        if (urls.has(canonical)) errors.push(`${label}: URL duplicada de ${urls.get(canonical)}; use uma fonte e localizadores distintos`);
        urls.set(canonical, source.id);
      } catch (error) {
        errors.push(`${label}: ${error.message}`);
      }
    }
    requireValue(source.derived_from === null || hasText(source.derived_from), `${label}.derived_from: ID ou null obrigatorio`);
    if (source.derived_from != null) references([source.derived_from], indexes.sources, `${label}.derived_from`);
  }

  const roots = new Set();
  for (const source of data.sources) {
    const visited = new Set();
    let current = source;
    while (current?.derived_from != null && !visited.has(current.id)) {
      visited.add(current.id);
      current = indexes.sources.get(current.derived_from);
    }
    if (current && visited.has(current.id)) errors.push(`sources.${source.id}: ciclo em derived_from`);
    else if (current) roots.add(current.id);
  }

  for (const evidence of data.evidence) {
    const label = `evidence.${evidence.id}`;
    references([evidence.source_id], indexes.sources, `${label}.source_id`);
    for (const key of ['locator', 'text']) text(evidence[key], `${label}.${key}`);
    choice(evidence.kind, ['citacao', 'parafrase', 'observacao'], `${label}.kind`);
    date(evidence.collected_at, `${label}.collected_at`);
  }
  for (const claim of data.claims) {
    const label = `claims.${claim.id}`;
    text(claim.text, `${label}.text`);
    text(claim.limitations, `${label}.limitations`);
    choice(claim.class, ['documentado', 'observado', 'relato', 'inferencia', 'nao_confirmado'], `${label}.class`);
    references(claim.evidence_ids, indexes.evidence, `${label}.evidence_ids`, claim.class !== 'nao_confirmado');
    references(claim.topic_ids, indexes.coverage, `${label}.topic_ids`, true);
    if (claim.supersedes != null) references([claim.supersedes], indexes.claims, `${label}.supersedes`);
    for (const evidenceId of Array.isArray(claim.evidence_ids) ? claim.evidence_ids : []) {
      const source = indexes.sources.get(indexes.evidence.get(evidenceId)?.source_id);
      if (source && ['documentado', 'observado'].includes(claim.class) && !['lida', 'parcial'].includes(source.access)) {
        errors.push(`${label}: ${source.access} nao sustenta ${claim.class}; registre evidencia indireta como relato/inferencia com limite`);
      }
    }
  }
  for (const query of data.queries) {
    const label = `queries.${query.id}`;
    references([query.topic_id], indexes.coverage, `${label}.topic_id`);
    if (query.topic_ids !== undefined) {
      references(query.topic_ids, indexes.coverage, `${label}.topic_ids`, true);
      requireValue(queryTopics(query).includes(query.topic_id), `${label}: topic_ids deve incluir topic_id principal`);
    }
    for (const key of ['query', 'tool', 'round']) text(query[key], `${label}.${key}`);
    choice(query.status, ['planejada', 'executada', 'falhou'], `${label}.status`);
    if (query.status === 'planejada') requireValue(query.executed_at === null, `${label}: consulta planejada nao tem executed_at`);
    else date(query.executed_at, `${label}.executed_at`);
    if (query.status === 'falhou') text(query.error, `${label}.error`);
    references(query.source_ids, indexes.sources, `${label}.source_ids`);
    references(query.new_evidence_ids, indexes.evidence, `${label}.new_evidence_ids`);
    if (query.status !== 'executada') requireValue(Array.isArray(query.new_evidence_ids) && query.new_evidence_ids.length === 0, `${label}: consulta nao executada nao produz evidencia`);
  }
  for (const item of data.frontier) {
    const label = `frontier.${item.id}`;
    text(item.question, `${label}.question`);
    text(item.reason, `${label}.reason`);
    choice(item.status, ['pendente', 'em_andamento', 'concluido', 'bloqueado', 'descartado'], `${label}.status`);
    references(item.source_ids, indexes.sources, `${label}.source_ids`);
    references([item.topic_id], indexes.coverage, `${label}.topic_id`);
    references(item.depends_on, indexes.frontier, `${label}.depends_on`);
    if (item.claim_ids !== undefined) references(item.claim_ids, indexes.claims, `${label}.claim_ids`);
    if (item.evidence_ids !== undefined) references(item.evidence_ids, indexes.evidence, `${label}.evidence_ids`);
    if (item.status === 'concluido') {
      requireValue((Array.isArray(item.claim_ids) && item.claim_ids.length > 0) || (Array.isArray(item.evidence_ids) && item.evidence_ids.length > 0), `${label}: concluido exige claim_ids ou evidence_ids do resultado`);
    }
    if (item.url != null) {
      try { canonicalUrl(item.url); } catch (error) { errors.push(`${label}: ${error.message}`); }
    }
  }
  checkCycles(indexes.frontier, 'depends_on');
  checkCycles(indexes.claims, 'supersedes');
  for (const topic of data.coverage) {
    const label = `coverage.${topic.id}`;
    text(topic.label, `${label}.label`);
    requireValue(typeof topic.essential === 'boolean', `${label}.essential: booleano obrigatorio`);
    choice(topic.status, ['nao_explorado', 'parcial', 'coberto', 'contraditorio', 'bloqueado', 'nao_localizado', 'nao_aplicavel'], `${label}.status`);
    references(topic.source_ids, indexes.sources, `${label}.source_ids`, topic.status === 'coberto');
    if (topic.status !== 'coberto') text(topic.gap, `${label}.gap`);
    if (topic.status === 'coberto') {
      const sourceIds = Array.isArray(topic.source_ids) ? topic.source_ids : [];
      requireValue(data.evidence.some(evidence => sourceIds.includes(evidence.source_id) && ['lida', 'parcial'].includes(indexes.sources.get(evidence.source_id)?.access)), `${label}: coberto exige evidencia de fonte examinada`);
    }
    requireValue(topic.closure === null || isObject(topic.closure), `${label}.closure: objeto ou null obrigatorio`);
    if (topic.status === 'coberto' && !isObject(topic.closure)) errors.push(`${label}.closure: justificativa obrigatoria`);
    if (isObject(topic.closure)) {
      const closure = topic.closure;
      choice(closure.reason, ['saturacao', 'universo_finito', 'orcamento', 'prazo', 'bloqueio', 'sem_ferramentas'], `${label}.closure.reason`);
      const needsExecution = ['universo_finito', 'saturacao'].includes(closure.reason) || topic.status === 'coberto';
      references(closure.query_ids, indexes.queries, `${label}.closure.query_ids`, needsExecution);
      requireValue(Number.isInteger(closure.rounds_without_new) && closure.rounds_without_new >= 0, `${label}.closure.rounds_without_new: inteiro nao negativo`);
      const closureIds = Array.isArray(closure.query_ids) ? closure.query_ids : [];
      const queries = closureIds.map(id => indexes.queries.get(id)).filter(Boolean);
      requireValue(queries.every(query => queryTopics(query).includes(topic.id) && (query.status === 'executada' || (!needsExecution && query.status === 'falhou'))), `${label}: consultas de encerramento devem pertencer a frente e ter estado compativel`);
      if (closure.reason === 'saturacao') {
        const allQueries = data.queries.filter(query => queryTopics(query).includes(topic.id) && query.status === 'executada');
        const rounds = [...new Set(allQueries.map(query => query.round))];
        const lastRounds = rounds.slice(-2);
        const closingQueries = allQueries.filter(query => lastRounds.includes(query.round));
        requireValue(lastRounds.length === 2 && closure.rounds_without_new >= 2 && closingQueries.every(query => query.new_evidence_ids?.length === 0 && closureIds.includes(query.id)), `${label}: saturacao exige duas ultimas rodadas executadas sem evidencia nova`);
      }
    }
  }

  choice(data.audit.status, ['pendente', 'revisado'], 'audit.status');
  requireValue(Array.isArray(data.audit.findings) && data.audit.findings.every(hasText), 'audit.findings: lista de textos obrigatoria');
  requireValue(data.audit.reviewed_by === null || hasText(data.audit.reviewed_by), 'audit.reviewed_by: texto ou null obrigatorio');
  if (data.audit.status === 'revisado') text(data.audit.reviewed_by, 'audit.reviewed_by');
  if (manifest.status === 'concluido_no_recorte') {
    requireValue(data.coverage.length > 0 && data.coverage.every(topic => ['coberto', 'nao_aplicavel'].includes(topic.status)), 'concluido_no_recorte: cobertura ainda incompleta');
    requireValue(data.frontier.every(item => ['concluido', 'descartado'].includes(item.status)), 'concluido_no_recorte: fila ainda aberta ou bloqueada');
    requireValue(data.audit.status === 'revisado' && Array.isArray(data.audit.findings) && data.audit.findings.length === 0, 'concluido_no_recorte: auditoria pendente ou com achados abertos');
  }
  if (data.sources.some(source => source.access === 'parcial')) warnings.push('Ha fontes parcialmente lidas; confira se as conclusoes respeitam os trechos acessados.');
  if (data.sources.some(source => source.derived_from == null)) warnings.push('Grupos de origem contam apenas relacoes declaradas; ausencia de derived_from nao prova independencia.');

  return {
    valid: errors.length === 0, errors, warnings, notice,
    counts: {
      sources: {
        total: data.sources.length,
        read: data.sources.filter(source => source.access === 'lida').length,
        partial: data.sources.filter(source => source.access === 'parcial').length,
        unread: data.sources.filter(source => !['lida', 'parcial'].includes(source.access)).length,
      },
      origin_groups: roots.size,
      evidence: data.evidence.length,
      claims: data.claims.length,
      coverage: {
        total: data.coverage.length,
        covered: data.coverage.filter(topic => topic.status === 'coberto').length,
        unresolved: data.coverage.filter(topic => !['coberto', 'nao_aplicavel'].includes(topic.status)).length,
        not_applicable: data.coverage.filter(topic => topic.status === 'nao_aplicavel').length,
      },
      frontier_open: data.frontier.filter(item => !['concluido', 'descartado'].includes(item.status)).length,
      queries_executed: data.queries.filter(query => query.status === 'executada').length,
    },
  };
}

try {
  const filename = process.argv[2];
  if (!filename || process.argv.length !== 3) throw new Error('uso: node validar-acervo.mjs caminho/acervo.json');
  const data = JSON.parse(readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const result = validate(data);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.valid ? 0 : 1;
} catch (error) {
  process.stderr.write(`Erro de entrada: ${error.message}\n`);
  process.exitCode = 2;
}