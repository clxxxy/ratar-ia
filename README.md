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

## Estrutura

| Caminho | Finalidade |
| --- | --- |
| [skills/rataria/SKILL.md](skills/rataria/SKILL.md) | Instruções carregadas pelo agente |
| [skills/rataria/references/metodo.md](skills/rataria/references/metodo.md) | Método detalhado e critérios de evidência |
| [skills/rataria/assets/estrutura-relatorio.md](skills/rataria/assets/estrutura-relatorio.md) | Estrutura da documentação entregue |
| [tests/cenarios.md](tests/cenarios.md) | Casos sintéticos e critérios de avaliação |
| [tests/resultados.md](tests/resultados.md) | Evidências e limitações dos testes realizados |

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

Formato baseado na [especificação Agent Skills](https://agentskills.io/specification)
e na [documentação de skills do VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills),
consultadas em 04/11/2026. Não há dependência de uma skill privada da YAITEC.