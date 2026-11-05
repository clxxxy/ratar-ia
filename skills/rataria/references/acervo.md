# Contrato do acervo e retomada

## Persistencia

Em pesquisa extensa, mantenha acervo.json no destino autorizado, junto do indice
e dos capitulos. O JSON tem registros logicos separados; nao exige banco, API ou
provedor. Use parser/serializador JSON, nao substituicoes de texto. O exemplo
preenchido distribuido com a skill e sintetico: nao o copie como pesquisa real.

Salve apos cada lote e antes de resumir/compactar contexto. O coordenador e o unico
escritor do acervo canonico; mantenha checkpoint anterior ate conferir a gravacao.
Em acervos grandes, guarde notas por frente e mantenha no acervo trechos minimos,
localizadores e caminhos, sem depender de um unico contexto de conversa.
Sem gravacao, entregue o JSON no chat, declare que nao foi salvo e nao prometa
retomada automatica. A skill nao agenda execucoes.

## Estrutura schema_version 1

Campos adicionais sao permitidos para contexto, escopo de versao e proveniencia.
Nao omita campos obrigatorios; dados desconhecidos ficam como "nao informado"
nos textos, null nas datas opcionais, listas vazias onde nao houve registros.
IDs sao estaveis, unicos dentro de cada registro e nunca reutilizados.

| Registro | Campos obrigatorios e significado |
| --- | --- |
| manifest | run_id, target, objective, status, started_at, updated_at, budget, tools, stop_reason, report_files |
| sources[] | id, url ou file, title, origin, type, published_at (ISO ou null), accessed_at (ISO), access, derived_from (ID ou null) |
| evidence[] | id, source_id, locator, text, kind, collected_at (ISO) |
| claims[] | id, text, class, evidence_ids, topic_ids, limitations |
| frontier[] | id, question, source_ids, topic_id, status, reason, depends_on |
| queries[] | id, topic_id, query, tool, status, executed_at (ISO ou null), source_ids, new_evidence_ids, round |
| coverage[] | id, label, essential (booleano), status, source_ids, gap, closure (objeto ou null) |
| audit | status (pendente/revisado), reviewed_by (texto ou null), findings (lista de textos dos achados ainda abertos) |

manifest.target: name, organization, edition, version, region, aliases[], excluded[].
objective: acervo ou decisao. status: em_andamento, parcial ou concluido_no_recorte.
budget: limit e used em texto, sem inventar custo/tempo. tools: search, browser,
subagents e persistence como booleanos que descrevem capacidades efetivas.
report_files: caminhos relativos ao destino da pesquisa; revisar existencia antes
da entrega. Acrescente material_mode (real, fornecido, sintetico ou misto) e
descreva no relatorio como cada material foi obtido.

### Fontes, trechos e afirmacoes

access: lida, parcial, catalogada, snippet, bloqueada ou indisponivel. O estado
descreve o material realmente acessado. Se recebeu resumo de uma pagina, registre
o arquivo/mensagem fornecido como fonte; nao marque a URL original como lida.
Pode registrar essa URL separadamente como catalogada e vincular o resumo.
Um aviso de login efetivamente lido e uma fonte diferente do contrato bloqueado:
vincule a afirmacao sobre o aviso ao material lido, nunca ao contrato inacessivel.
url preserva o endereco original; file identifica material local ou mensagem
fornecida (com localizador que permita reencontra-la). Nunca inclua segredos.

derived_from liga uma republicacao ao registro de origem quando isso e conhecido.
Ausencia de vinculo nao prova independencia. Para copia sem origem lida, cadastre
a origem como catalogada. fingerprint e canonical_url podem ajudar, mas hash igual
identifica conteudo igual, nao autoridade, verdade ou data de validade.

kind: citacao, parafrase ou observacao. locator: secao/ancora, pagina, linha ou
timestamp. Preserve ressalvas, numeros, versao e contexto relevantes. OCR,
transcricao automatica, extracao parcial e traducoes devem constar no limite.

Uma afirmacao por registro: escreva uma proposicao verificavel, com alcance e
ressalvas. Nao agrupe autenticacao, endpoints e paginacao em uma unica afirmacao
para encurtar o acervo. Use IDs de topicos para organizar, nao para fundir fatos.
Localizadores devem ser reencontraveis: por exemplo /pages/3/text (JSON Pointer),
pagina 2 do PDF ou secao Exportacao. Nao invente sintaxe de localizacao.

class: documentado, observado, relato, inferencia ou nao_confirmado. Exceto
nao_confirmado, cada afirmacao exige evidencia; todas exigem topico e limitations.
Uma inferencia explica suas premissas. Snippet pode sustentar somente uma
afirmacao explicitamente indireta, nunca leitura da fonte ou observacao operacional.
Escreva "o resumo fornecido afirma", nao "o contrato vigente garante".

### Fila, consultas e cobertura

frontier.status: pendente, em_andamento, concluido, bloqueado ou descartado.
reason descreve resultado ou motivo de pendencia/descarte; url e assigned_to
sao opcionais. depends_on contem IDs de outras pistas; evite dependencias ciclicas.
Pista concluida exige resultado em claim_ids e/ou evidence_ids existentes.

queries.status: planejada, executada ou falhou. Use executed_at null para
planejada; falhou exige error e nao produz evidencias novas. query registra
consulta ou acao de leitura real, tool a ferramenta usada e round o lote coerente
de uma pergunta como texto, por exemplo "R1", "R2"; nao use numero. Datas ISO
podem conter apenas o dia quando o horario nao foi medido. Nao invente precisao.
Liste apenas evidencias novas em new_evidence_ids.
Armazene consultas em ordem de execucao; nao invente rodadas para satisfazer gates.
Quando uma unica leitura cobre varias frentes, acrescente topic_ids com todos
os IDs pertinentes, incluindo topic_id principal. As frentes podem citar essa
mesma consulta sem inventar novas chamadas. Sem topic_ids, vale apenas topic_id.

coverage.status: nao_explorado, parcial, coberto, contraditorio, bloqueado,
nao_localizado ou nao_aplicavel. gap explica falta ou inaplicabilidade.
essential ajuda a priorizar, nao apaga topicos secundarios do modo acervo.

closure: reason, query_ids e rounds_without_new. reason: universo_finito,
saturacao, orcamento, prazo, bloqueio ou sem_ferramentas. Coberto exige fontes
e justificativa; somente evidencias adequadas ao recorte autorizam esse estado.
Saturacao exige duas ultimas rodadas executadas sem evidencia nova e diversidade
de caminhos pertinente revisada por pessoa/agente. O script verifica apenas a
consistencia dos registros, nao essa diversidade nem a adequacao da evidencia.

Para encerramento parcial por orcamento, prazo, bloqueio ou falta de ferramentas,
query_ids pode estar vazio se nenhuma consulta ocorreu. Uma tentativa que falhou
pode ser referenciada para justificar bloqueio, nunca para provar saturacao ou
cobertura. Nao invente consultas para preencher o registro.

## Encerramento, metricas e deltas

manifest.stop_reason usa os mesmos motivos de closure; durante em_andamento
pode ser null. concluido_no_recorte exige todos os topicos cobertos ou
justificadamente nao_aplicaveis, fila sem itens abertos e auditoria revisada sem
achados abertos. Bloqueio com impacto ou topico nao explorado implica parcial.
Em modo decisao, o recorte pode ser menor, mas precisa ter sido declarado antes.

Conte separadamente fontes descobertas, lidas, parciais e nao lidas; pistas
abertas; topicos cobertos e pendentes; afirmacoes sem confirmacao. Quando houver
denominador finito conhecido, informe por exemplo "8 de 12 paginas inventariadas
examinadas". Nao converta esse numero em percentual de todo o conhecimento.
Grupos de origem calculados pelo script refletem apenas derived_from declarado.

Ao retomar: leia manifest, coverage, frontier e achados de audit; confira o ultimo
checkpoint, identidade, ferramentas e novo orcamento. Revalide precos, planos,
limites, versoes e incidentes conforme volatilidade, nao apenas fontes novas.
Preserve o checkpoint anterior antes de mudar versoes de fontes ou trechos.
Acrescente afirmacao com supersedes: ID anterior e preserve o historico, nunca
reescreva silenciosamente uma conclusao antiga. O relatorio separa conclusoes
vigentes, historico e mudancas; registre previous_run quando houver nova execucao.

Quando o conteudo de uma URL mudar, preserve seu source_id e os trechos antigos;
acrescente evidencias com collected_at e, se necessario, source_version e caminho
do snapshot autorizado. Uma versao nova do mesmo documento nao e outra fonte
independente. Preserve o checkpoint anterior antes de atualizar metadados da fonte.

## Validacao opcional, sem rede

Com Node.js 18+ ja disponivel, execute a partir do repositorio:

```sh
node skills/rataria/scripts/validar-acervo.mjs caminho/acervo.json
```

Em instalacao copiada, resolva o script a partir da raiz instalada da skill, nao
do diretorio da pesquisa. O script somente le o JSON e escreve resultado no
stdout: nao altera arquivos nem consulta URLs. Codigos: 0 integridade aceita,
1 contrato inconsistente, 2 arquivo/JSON/argumentos invalidos.

Revisa IDs, vinculos, campos, URLs duplicadas com rastreamento conhecido,
grupos de origem declarados, contagens e encerramentos contraditorios. Preserva
parametros de paginacao. Nao verifica existencia de paginas/arquivos citados,
conteudo dos links, segredos no texto livre ou suporte semantico das afirmacoes.
Revise esses pontos separadamente. Sem Node, faca revisao manual e declare que
o validador nao foi executado; nao instale dependencias automaticamente.