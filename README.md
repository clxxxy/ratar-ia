# RatarIA

Pesquisa aprofundada com IA, fontes rastreáveis e limites explícitos.
O nome combina "rataria" com "IA": investigar os cantos relevantes sem
confundir quantidade de buscas com qualidade da evidência.

## O que entrega

Um acervo organizado de achados, referências, contradições, riscos e lacunas.
Serve para estudar produtos, ferramentas, APIs, processos, mercados ou outros
temas que exijam múltiplas fontes. Não se limita a software ou ao Omie.

O método combina fontes primárias, materiais práticos e perspectivas externas,
conforme a pergunta. Distingue fato documentado, observação, relato, inferência e
informação não confirmada. Não promete cobrir toda a internet.

## Investigação coordenada

- **Modo acervo:** inventaria todas as dimensões pertinentes e acessíveis,
  inclusive recursos secundários que não mudam uma decisão imediata.
- **Modo decisão:** prioriza perguntas decisórias sem apagar as pistas restantes.
- Confirma identidade, edição, versão, região e homônimos antes de atribuir recursos.
- Mapeia superfícies: produto, ajuda, APIs, planos, políticas, histórico, status,
  integrações e experiências externas, adaptadas ao objeto.
- Distribui frentes entre pesquisadores quando o ambiente permite e autoriza;
  sem subagentes, executa o mesmo protocolo sequencialmente.
- Mantém fila de descobertas com origem, dependências e próxima ação; paginação,
  PDF e conteúdo dinâmico não somem porque a primeira extração falhou.
- Preserva fontes, evidências, afirmações e consultas em um checkpoint estruturado.
- Audita omissões e suporte das conclusões; reabre frentes dentro do orçamento.
- Encerra por frente e permite atualização incremental com IDs e histórico preservados.

"Tudo" significa explorar sistematicamente o recorte acessível e mostrar o que
falta, não prometer onisciência. Uma lacuna registrada não vira tópico coberto.
Contagens descrevem o universo descoberto, não todo o conhecimento existente.

## Estrutura

| Caminho | Finalidade |
| --- | --- |
| [skills/rataria/SKILL.md](skills/rataria/SKILL.md) | Instruções carregadas pelo agente |
| [skills/rataria/references/metodo.md](skills/rataria/references/metodo.md) | Método detalhado e critérios de evidência |
| [skills/rataria/references/descoberta.md](skills/rataria/references/descoberta.md) | Superfícies, coleta, paginação, PDF, SPA e falhas |
| [skills/rataria/references/coordenacao.md](skills/rataria/references/coordenacao.md) | Contratos de frentes, orçamento, consolidação e auditoria |
| [skills/rataria/references/acervo.md](skills/rataria/references/acervo.md) | Contrato JSON, checkpoint, encerramento e retomada |
| [skills/rataria/assets/estrutura-relatorio.md](skills/rataria/assets/estrutura-relatorio.md) | Estrutura da documentação entregue |
| [skills/rataria/assets/exemplo-acervo.json](skills/rataria/assets/exemplo-acervo.json) | Exemplo preenchido, explicitamente sintético |
| [skills/rataria/scripts/validar-acervo.mjs](skills/rataria/scripts/validar-acervo.mjs) | Validador mecânico opcional, sem rede |
| [tests/cenarios.md](tests/cenarios.md) | Casos sintéticos e critérios de avaliação |
| [tests/resultados.md](tests/resultados.md) | Evidências e limitações dos testes realizados |
| [tests/fixtures/atlas.json](tests/fixtures/atlas.json) | Site sintético representado em JSON, com 18 superfícies |
| [tests/fixtures/atlas-relatorio.md](tests/fixtures/atlas-relatorio.md) | Saída textual da aplicação da skill à fixture |
| [tests/fixtures/atlas-acervo.json](tests/fixtures/atlas-acervo.json) | Checkpoint gerado na aplicação, após reparos documentados |
| [tests/fixtures/atlas-delta.json](tests/fixtures/atlas-delta.json) | Atualização sintética produzida em contexto novo |
| [tests/validar-acervo.test.mjs](tests/validar-acervo.test.mjs) | Regressões locais do validador e dos checkpoints |

Nome de apresentação: **RatarIA**. Identificador Agent Skills: **rataria**.
O identificador usa minúsculas e corresponde à pasta que contém SKILL.md.
O nome do repositório, `ratar-ia`, é independente desse identificador.

## Uso

Depois de instalar a skill em um cliente compatível:

> Use a RatarIA para pesquisar profundamente esta ferramenta. Quero entender
> capacidades, restrições, mudanças recentes e relatos de uso. Organize a
> documentação em docs/pesquisa. Não faça alterações na ferramenta.

Também são gatilhos: "pesquise a fundo", "investigue por todos os cantos",
"pesquisa estilo rato", "levantamento completo" e "deep research".

Informe o tema e a finalidade. Público, prazo, profundidade, formato e pasta de
saída podem ser definidos no pedido. A skill deve procurar primeiro no contexto
disponível e perguntar apenas o que altera uma decisão importante.

Para um acervo amplo:

> Use a RatarIA em modo acervo para documentar o produto X, edição Y. Inclua
> recursos, ajuda, API, limites, histórico, políticas e relatos, mesmo quando não
> mudam uma decisão imediata. Salve em docs/pesquisa. Use somente acessos já
> autorizados; limite a pesquisa a 30 minutos e entregue checkpoint com pendências.

Para retomar, forneça o acervo anterior, a atualização desejada e novo orçamento.
O agente deve preservar os IDs, revalidar dados voláteis e registrar o que mudou.
Nenhum monitoramento ou agendamento é criado automaticamente.

## Instalação opcional

Este repositório não instala a skill automaticamente. Copie a pasta inteira
`skills/rataria`, preservando references e assets, para uma localização suportada
pelo seu cliente. Confira antes se já existe uma skill com o mesmo identificador;
não a sobrescreva sem revisar.

Exemplos de destinos, sujeitos ao suporte e à configuração do cliente:

- Projeto VS Code/Copilot: `.github/skills/rataria/`.
- Projeto com Agent Skills: `.agents/skills/rataria/`.
- Perfil pessoal compatível: `~/.agents/skills/rataria/`.
- Claude Code: `.claude/skills/rataria/` ou `~/.claude/skills/rataria/`.

A descoberta depende do cliente; reinicie/recarregue a sessão se necessário.
Se o cliente expuser skills como comandos, o identificador será `rataria`, não
uma garantia de comando universal em todas as ferramentas.

## Requisitos e limites

- Agente com leitura de arquivos e acesso às ferramentas de pesquisa disponíveis.
- Navegação web é necessária para pesquisa atualizada na internet. Sem ela, o
  resultado deve ser limitado e identificado como análise do material fornecido.
- Nenhuma API de busca, provedor de IA ou navegador específico é obrigatório.
- Subagentes são opcionais e dependem de suporte e autorização do cliente.
- Escrita local permite checkpoints duráveis; sem ela, o agente entrega JSON
  no chat e declara que nenhum arquivo foi salvo.
- Node.js 18+ é necessário somente para o validador e os testes opcionais;
  não é requisito para carregar a skill. Nenhum pacote npm é necessário.
- Login é opcional, somente quando uma lacuna relevante exigir área autenticada.
  O usuário autentica diretamente no navegador; senhas e códigos não passam pelo chat.
- O fluxo é de pesquisa e documentação autorizada, sem mudanças operacionais no
  objeto pesquisado. A skill não inclui publicação ou administração de ambientes.
- Os materiais são conteúdo de instrução, não uma barreira técnica de segurança.
  As permissões e ferramentas do agente precisam ser configuradas separadamente.

## Validação

Os testes usam um produto fictício e fontes sintéticas, sem chamadas a sistemas
reais. Consulte os cenários e resultados; não confunda revisão estrutural com
garantia de que qualquer agente seguirá todas as instruções.

Com Node.js disponível, a partir da raiz do repositório:

```sh
node --test tests/validar-acervo.test.mjs
node skills/rataria/scripts/validar-acervo.mjs skills/rataria/assets/exemplo-acervo.json
node skills/rataria/scripts/validar-acervo.mjs caminho/da/pesquisa/acervo.json
```

O script lê o acervo sem alterar arquivos ou acessar a rede. Verifica campos,
referências, duplicações conservadoras de URL, ciclos, contagens e encerramentos
contraditórios. Código 0 significa integridade aceita; 1, inconsistência; 2, erro
de entrada. Não comprova verdade, leitura real, validade de links, independência
das fontes, ausência de segredos no texto ou completude. Esses pontos exigem revisão.

O cenário com oráculo mede recuperação de 12 fatos de um pacote fechado, não
recall da internet. A fixture inclui PDF textual, representação de SPA, paginação,
republicações, homônimo e portal bloqueado; não substitui navegador real.

Formato baseado na [especificação Agent Skills](https://agentskills.io/specification)
e na [documentação de skills do VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills),
consultadas em 04/11/2026. Não há dependência de uma skill privada da YAITEC.

## Referências de desenho

Comparação documental de 04/11/2026, não benchmark de superioridade:
[Tavily Research](https://github.com/tavily-ai/skills/blob/main/skills/tasks/tavily-research/SKILL.md),
[Firecrawl Deep Research](https://github.com/firecrawl/firecrawl-workflows/blob/main/skills/firecrawl-deep-research/SKILL.md),
[199 Deep Research](https://github.com/199-biotechnologies/claude-deep-research-skill/blob/main/SKILL.md),
[DeerFlow](https://github.com/bytedance/deer-flow/blob/main/skills/public/deep-research/SKILL.md)
e [pesquisa multiagente da Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system).
Foram aproveitados conceitos de coordenação, persistência e revisão, sem tornar
provedores, quotas de fontes ou metas de palavras obrigatórios.