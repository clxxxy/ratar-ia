# Instalacao e distribuicao

A pasta skills/rataria e a fonte unica. O pacote npm, o plugin e o catalogo
distribuem esses mesmos arquivos, sem hooks, servidores ou instalacao automatica
no perfil durante npm install. Escolha um canal por cliente; os gerenciadores
nao compartilham recibos nem assumem posse de instalacoes uns dos outros.

## Estado da entrega

- Publicacao de ratar-ia@0.1.0 aceita pelo npm em 05/11/2026, com licenca MIT.
  O registry informou processamento antes de disponibilizar a primeira versao.
- Plugin rataria e catalogo proprio clxxxy-rataria preparados no repositorio.
- Instalacao pelo gerenciador externo de skills usa a pasta ja existente.
- Nenhum push, commit, submissao a diretorio oficial ou instalacao pessoal foi
  executado nesta entrega. Plugin e catalogo remoto dependem de enviar os
  manifests ao GitHub; vincular contas npm/GitHub nao envia esses arquivos.

## Instalador local e npm

Requer Node.js 18.3+; nao tem dependencias. Para usar a copia local, execute na raiz:

```sh
node cli/rataria.mjs install --client copilot --scope project --dry-run
node cli/rataria.mjs install --client copilot --scope project
node cli/rataria.mjs update --client copilot --scope project
node cli/rataria.mjs uninstall --client copilot --scope project
```

Pelo npm, apos a versao estar disponivel no registry:

```sh
npx ratar-ia@latest install --client copilot --scope user
npx ratar-ia@latest update --client copilot --scope user
npx ratar-ia@latest uninstall --client copilot --scope user
```

Para fixar uma versao publicada, use por exemplo npx ratar-ia@0.1.0 no lugar de
npx ratar-ia@latest. update instala a versao do pacote que voce executou, nao
consulta o registry nem inicia atualizacao em segundo plano. Nao rode update
durante uma pesquisa ativa; recarregue o cliente depois de concluir.

| --client | --scope project | --scope user |
| --- | --- | --- |
| copilot | .github/skills/rataria | ~/.copilot/skills/rataria |
| claude | .claude/skills/rataria | ~/.claude/skills/rataria |
| codex | .agents/skills/rataria | ~/.agents/skills/rataria |
| agents | .agents/skills/rataria | ~/.agents/skills/rataria |

project e o padrao; cliente e obrigatorio. --project aponta outro diretorio de
projeto e nao pode ser combinado com --scope user. --json retorna o resultado
estruturado; --help e --version nao fazem instalacao. A descoberta depende do
cliente e suas politicas, nao apenas da existencia da pasta.

## Protecao de arquivos

O instalador grava .rataria-install.json dentro da skill, com versao, hashes
e diretorios criados. update e uninstall conferem os arquivos antes de alterar
qualquer recurso. Edicoes ou exclusoes locais causam interrupcao; nao ha --force.
Arquivos extras e diretorios preexistentes sao preservados, mesmo quando vazios.

Instalacao manual, via plugin ou via outro gerenciador nao e adotada pelo CLI.
Faca backup e use o gerenciador original para remove-la antes de trocar de canal.
Para uma edicao local, preserve seu arquivo fora da skill e compare com a versao
distribuida antes de restaurar o recurso original. Nao apague/adultere o recibo
para contornar conflitos: ele e um registro operacional, nao uma assinatura.

Links simbolicos e junctions no caminho gerenciado sao recusados. As transacoes
usam staging, trava exclusiva e backup para restauracao em falhas detectadas.
Se a restauracao falhar, o erro informa o backup preservado: recupere essa pasta
antes de repetir. Uma interrupcao abrupta pode deixar trava/staging/backup;
confira se nao ha processo ativo e preserve o backup antes de limpeza manual.
Nao se promete recuperacao automatica de queda de energia ou processo encerrado.

## Catalogo de skills

O repositorio segue o formato Agent Skills, reconhecido pelo gerenciador externo:

```sh
npx skills add clxxxy/ratar-ia --skill rataria
npx skills check
npx skills update rataria
```

Use -g no add para instalacao pessoal. Esse CLI externo tem seus proprios
requisitos, configuracao, telemetria e politica de atualizacao; confira sua
[documentacao](https://github.com/vercel-labs/skills). Os requisitos dele nao sao
os mesmos do instalador local. A indexacao em um catalogo publico nao e garantida
apenas por criar manifests; depende das regras do servico.

## Plugin e marketplace

O catalogo proprio esta em [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json)
e o plugin em [.claude-plugin/plugin.json](.claude-plugin/plugin.json).
Ambos reutilizam skills/rataria na raiz. Nao ha extensao de VS Code separada.

Em Claude Code compativel, depois de publicar os arquivos no GitHub:

```sh
claude plugin marketplace add clxxxy/ratar-ia
claude plugin install rataria@clxxxy-rataria --scope user
claude plugin marketplace update clxxxy-rataria
claude plugin update rataria@clxxxy-rataria
claude plugin uninstall rataria@clxxxy-rataria --scope user
```

Para verificar os manifests sem instalar:

```sh
claude plugin validate . --strict
claude plugin validate .claude-plugin/plugin.json --strict
```

O cliente tambem permite carregar a pasta com claude --plugin-dir . em uma sessao
de teste. Isso carrega a skill; so execute esse teste quando desejar usá-la.
O catalogo proprio nao equivale a uma listagem no diretorio oficial. Submissao e
aprovacao externas sao etapas separadas. Outros clientes podem consumir esse
formato, mas sua descoberta precisa ser conferida no cliente escolhido.

## Versoes e publicacao

package.json e a fonte da versao. O comando de versao sincroniza plugin.json;
o prepack apenas confere consistencia. Sem tags ou commits automaticos:

```sh
npm version patch --no-git-tag-version
npm run check:distribution
npm test
npm pack --dry-run
```

A licenca [MIT](LICENSE) foi aprovada para o projeto. Antes da primeira
publicacao, confira a titularidade e disponibilidade do nome ratar-ia na conta
npm correta e conclua a autenticacao diretamente no terminal.
Se o nome precisar mudar, atualize pacote, CLI, verificador e exemplos antes de
publicar. Nunca publique sob nome/conta de outra pessoa nem envie credenciais pelo chat.

A publicacao deve ser feita por uma pessoa autorizada, autenticada diretamente
no terminal, depois de revisar o conteudo do pacote:

```sh
npm publish --dry-run
npm publish --access public
```

Depois de revisar e enviar os manifests ao GitHub, confira instalacao e descoberta
em uma sessao nova. Para releases seguintes, aumente a versao antes de distribuir;
nao altere os bytes de uma versao npm ja publicada. Nenhuma pipeline aqui publica
pacotes ou cria releases automaticamente.

## Evidencia local

Os testes usam pastas temporarias. npm test inclui empacotamento offline e
instalacao/remocao do tarball por npm exec fora deste repositorio, com cache
temporario; nao instala no perfil pessoal. Os testes cobrem conflitos, hashes,
diretorios extras, nomes com casing diferente, junctions, recibo com traversal,
concorrencia real e falhas controladas de promocao/rollback. O teste de tarball
requer execucao via npm test; node --test direto o identifica como ignorado.

Em 05/11/2026, npm test terminou com 51 aprovados, zero falhas e zero ignorados
no Windows com Node.js v24.6.0. Veja [tests/resultados.md](tests/resultados.md).

Plugin e marketplace foram aceitos pelo validador oficial em modo estrito no
Windows. A CI verifica Node 18/22/24 em Windows e Linux; a execucao remota da CI
e a descoberta em clientes nao foram demonstradas apenas pela configuracao.

Referencias: [formato de plugins](https://code.claude.com/docs/en/plugins-reference),
[marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) e
[locais de skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills).