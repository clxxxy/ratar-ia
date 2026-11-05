# Descoberta e coleta

## Identidade antes da expansao

Registre nome, organizacao, dominio oficial, edicao, versao, regiao, idioma,
aliases, nomes antigos e homonimos excluidos. Use "nao informado" quando ausente.
Nao atribua ao alvo um recurso encontrado apenas em outro produto ou plano.
Confirme a data atual no contexto confiavel; use filtros temporais conforme a
pergunta, sem eliminar documentos antigos ainda pertinentes.

## Mapa de superficies

Estas linhas sao sementes, nao checklist universal nem lista fechada. Crie uma
linha em coverage por superficie pertinente e acrescente dimensoes descobertas.
Em modo acervo, registre tambem recursos sem impacto decisorio imediato. Ausencia
de evidencia gera fila; nao transforme isso em "recurso inexistente".

| Superficie | Onde procurar e o que preservar |
| --- | --- |
| Produto e features | Paginas de produto, catalogos, menus, fluxos, edicoes e requisitos |
| Documentacao | Indice, busca interna, guias, FAQ, exemplos e arquivos para download |
| Contratos tecnicos | API, OpenAPI, SDK, schemas, erros, limites, autenticacao e webhooks |
| Operacao documentada | Implantacao, migracao, exportacao, backup, recuperacao e suporte |
| Comercial | Precos publicos, planos, cotas, adicionais, elegibilidade e restricoes |
| Seguranca e dados | Politicas, retencao, permissoes, auditoria, termos e privacidade |
| Historico | Changelog, releases, notas de migracao, deprecacoes e documentos antigos |
| Confiabilidade | Status e incidentes publicados, periodo, regiao e efeito documentado |
| Ecossistema | Integracoes, marketplace, repositorios oficiais, issues e discussoes |
| Uso externo | Tutoriais, estudos, reviews, comunidades, videos e criticas |

Em repositorios autorizados, leia manifestos, codigo controlador, testes, exemplos
e documentacao; nao execute scripts ou exemplos para preencher lacunas sem escopo
separado. Em sites, inventarie interfaces acessiveis sem disparar operacoes.
Em produtos fisicos, processos ou outros dominios, substitua APIs por manuais,
especificacoes, certificacoes, estudos e dimensoes pertinentes.

## Descoberta em largura

1. Parta de fontes primarias e do material local. Localize indices, navegacao,
   sitemaps publicados, documentos de descoberta como llms.txt quando presentes,
   paginas de ajuda e links explicitamente publicados para outros dominios.
2. Combine caminhos: busca externa, busca interna, referencias de documentos,
   repositorios e perspectivas independentes. Buscador nao inventaria um site.
3. Varie nomes, aliases, idiomas pertinentes, perguntas, periodos e termos usados
   nas proprias fontes. Procure tambem restricoes, bugs relatados, descontinuacao,
   comparacoes e contraexemplos, nao apenas beneficios.
4. Mantenha fronteiras de dominio, caminho, tempo e tipo. Seguir um link nao
   autoriza varrer subdominios privados, enumerar endpoints ou coletar pessoas.
5. Cada pista recebe frontier.id, pergunta, fonte de origem, topico, estado,
   responsavel e dependencias. Dentro do recorte, priorize sem apagar. Fora dele,
   registre motivo e solicite autorizacao antes de expandir a investigacao.

Nao use contagem minima de fontes como certificado de qualidade. Uma especificacao
primaria pode resolver um ponto; dezenas de copias podem repetir o mesmo erro.

## Escolha de ferramenta e falhas

| Situacao observada | Acao e registro |
| --- | --- |
| Tema sem URL | Busca por angulos, seguida de leitura das fontes pertinentes |
| URL conhecida | Extracao; conferir conteudo, titulo, tabela, rodape e limites |
| Site sem indice conhecido | Navegacao, sitemap ou ferramenta de mapeamento disponivel |
| Secao com muitas paginas | Coleta limitada por caminhos e orcamento; registrar itens omitidos |
| Extracao trouxe apenas menu | Marcar parcial; usar renderizacao autorizada ou registrar bloqueio |
| Tabela ou conteudo expansivel | Conferir renderizacao e notas; interagir apenas sem efeitos operacionais |
| PDF ou imagem | Extracao textual e, se necessario/disponivel, OCR ou inspecao visual |
| Video/audio | Transcricao com localizador temporal, se disponivel; catalogar quando nao analisado |
| JSON, CSV ou OpenAPI publico | Parser estruturado; conferir schema, filtros, verbos e paginacao |
| 403, CAPTCHA, login ou paywall | Registrar limite; procurar alternativa publica legitima, sem contornar |
| 429 ou falha transitoria | Respeitar limites/retry-after; tentativas limitadas e fila pendente |

Nao instalar ferramentas, criar conta ou aceitar custos so porque a coleta falhou.
Explique a capacidade ausente. Sem navegador, OCR ou transcricao, o restante pode
continuar; marque exatamente quais informacoes ficaram inacessiveis.

## Paginas e conteudo nao sao a mesma unidade

Siga paginacao e referencias ate o limite observado, registrando proxima pagina,
cursores, filtros e totais declarados versus obtidos. Nao remova parametros como
page, cursor, version, lang ou plan ao deduplicar. Remova apenas rastreamento
conhecido; preserve URL original e use o localizador para fragmentos e secoes.

Fragmento de secao nao e o mesmo que rota de SPA: #/planos e #/seguranca podem
representar conteudos distintos. Preserve rotas e nao una URLs cuja equivalencia
nao foi demonstrada; o validador preserva fragmentos iniciados por / ou !.

Para cada coleta confira truncamento, anexos omitidos, conteudo carregado por JS,
tabelas perdidas, idioma e versao. Um extrator que retorna um resumo nao comprova
leitura integral. Nao copie snapshots integrais protegidos; preserve somente o
material autorizado e os trechos necessarios com localizadores.

Use robots.txt, termos e limites de acesso aplicaveis. Nao faca descoberta por
forca bruta, varredura de seguranca ou acesso a dados privados. Registros de
pesquisa tambem podem conter dados sensiveis: minimize, anonimize e nao guarde
cookies, tokens, cabecalhos de autorizacao ou URLs com credenciais.