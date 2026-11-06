<p align="center">
	<a href="https://github.com/user-attachments/assets/1fda9566-c25f-4248-a8d1-3353a2e4a90d#gh-dark-mode-only">
		<img src="https://github.com/user-attachments/assets/1fda9566-c25f-4248-a8d1-3353a2e4a90d" alt="Logo RatarIA" width="240" />
	</a>
	<a href="https://github.com/user-attachments/assets/bd65e716-f177-4cda-a8e1-a0f9874dbddc#gh-light-mode-only">
		<img src="https://github.com/user-attachments/assets/bd65e716-f177-4cda-a8e1-a0f9874dbddc" alt="Logo RatarIA" width="240" />
	</a>
</p>

<h1 align="center">RatarIA</h1>

<p align="center">
	Uma skill para agentes de IA pesquisarem aplicações, sites, features e produtos
	em profundidade, organizando os achados com fontes e deixando claro o que falta verificar.
</p>

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

Escolha um canal por cliente para evitar instalações duplicadas.

### Catálogo de skills

```sh
npx skills add clxxxy/ratar-ia --skill rataria
```

O gerenciador permite escolher o cliente. Adicione `-g` para instalar no perfil
pessoal e reutilizar entre projetos; confira os requisitos do gerenciador externo.

### Plugin para Claude Code

Após os manifests desta versão estarem disponíveis no GitHub, use no chat do Claude Code:

```text
/plugin install rataria --marketplace clxxxy/ratar-ia
```

### npm / npx

Instale pelo npm (a primeira publicação pode levar alguns minutos para ficar disponível):

```sh
npx ratar-ia@latest install --client copilot --scope user
```

O instalador requer Node.js 18.3+. Clientes: `copilot`, `claude`, `codex` e `agents`.
Use `--scope project` para instalar apenas no projeto atual ou `--dry-run` para simular.

Também é possível executar o instalador na raiz deste repositório:

```sh
node cli/rataria.mjs install --client copilot --scope user
```

Recarregue o cliente após instalar. Veja [DISTRIBUTION.md](DISTRIBUTION.md) para
atualizar, remover, fixar versões ou publicar. A publicação externa não é automática.

## Requisitos e limites

Precisa de um agente compatível com skills e leitura de arquivos. Acesso à web
permite pesquisa atualizada; sem ele, a análise fica limitada ao material fornecido.
Salvar o acervo exige permissão de escrita. Nenhum provedor específico é obrigatório.

A skill pesquisa e documenta: não altera sistemas nem cria contas. Usa somente
acessos autorizados e não solicita segredos no chat. Busca a maior cobertura possível
dentro dos limites definidos, sem prometer encontrar toda a informação existente.

## Validação opcional

Na raiz do repositório, sem instalar dependências:

```sh
npm test
npm run check:distribution
node skills/rataria/scripts/validar-acervo.mjs caminho/acervo.json
```

O validador verifica a estrutura e as referências do acervo, não a veracidade ou
a completude da pesquisa. Os testes usam dados fictícios; detalhes em
[tests/resultados.md](tests/resultados.md).

## Licença

[MIT](LICENSE).