# RatarIA

Uma skill para agentes de IA pesquisarem aplicações, sites, features e produtos
em profundidade, organizando os achados com fontes e deixando claro o que falta verificar.

## O que faz

- Investiga recursos, documentação, APIs, planos, limites, histórico e relatos de uso.
- Divide a pesquisa entre agentes quando disponíveis; caso contrário, trabalha sequencialmente.
- Confronta fontes e separa fatos documentados, relatos e informações não confirmadas.
- Entrega uma síntese, documentação por assunto e um acervo com evidências e pendências.
- Permite retomar a pesquisa e atualizar os achados sem perder o histórico.

Dois modos: **acervo**, para mapear o objeto de forma abrangente; **decisão**,
para responder perguntas específicas ou comparar alternativas.

## Como usar

Depois de instalar, peça ao agente:

> Use a RatarIA em modo acervo para pesquisar o produto X. Investigue recursos,
> documentação, API, planos, limitações e relatos. Salve em docs/pesquisa.
> Limite a pesquisa a 30 minutos e registre o que ficar pendente. Não altere o produto.

Informe o tema, o objetivo e os limites de tempo ou acesso. Para continuar depois,
forneça o acervo anterior e diga o que deseja aprofundar ou atualizar.

## Instalação

Copie a pasta [skills/rataria](skills/rataria/SKILL.md) inteira, incluindo seus
recursos, para o diretório de skills do seu cliente:

| Cliente | Destino no projeto |
| --- | --- |
| VS Code / Copilot | `.github/skills/rataria/` |
| Clientes compatíveis com Agent Skills | `.agents/skills/rataria/` |
| Claude Code | `.claude/skills/rataria/` |

O suporte depende do cliente. Recarregue a sessão se necessário e revise qualquer
instalação existente antes de substituí-la.

## Requisitos e limites

Precisa de um agente compatível com skills e leitura de arquivos. Acesso à web
permite pesquisa atualizada; sem ele, a análise fica limitada ao material fornecido.
Salvar o acervo exige permissão de escrita. Nenhum provedor específico é obrigatório.

A skill pesquisa e documenta: não altera sistemas nem cria contas. Usa somente
acessos autorizados e não solicita segredos no chat. Busca a maior cobertura possível
dentro dos limites definidos, sem prometer encontrar toda a informação existente.

## Validação opcional

Com Node.js 18+, sem instalar pacotes:

```sh
node --test tests/validar-acervo.test.mjs
node skills/rataria/scripts/validar-acervo.mjs caminho/acervo.json
```

O validador verifica a estrutura e as referências do acervo, não a veracidade ou
a completude da pesquisa. Os testes usam dados fictícios; detalhes em
[tests/resultados.md](tests/resultados.md).