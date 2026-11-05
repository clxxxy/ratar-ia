# Coordenacao da investigacao

## Coordenador e frentes

O coordenador confirma identidade, recorte, ferramentas e orcamento; mantem mapa,
fila e acervo canonico. Crie frentes por perguntas independentes, nao um agente
por link. Nao abra subagentes sem suporte e autorizacao do ambiente. Sem eles,
execute o mesmo protocolo sequencialmente e declare essa limitacao.

Possiveis frentes: produto e ajuda; contratos tecnicos; planos e politicas;
historico e operacao publicada; experiencias externas e contrapontos. Combine
ou subdivida conforme volume, dependencia e orcamento. Nao imponha numero fixo.

Antes de delegar, reserve parte do orcamento para consolidacao, auditoria e entrega.
Distribua limites por frente cuja soma caiba no limite global. Registre gastos
reais quando a ferramenta os informa; ausencia de metrica significa desconhecido,
nao zero. Limite concorrencia e tentativas para respeitar servicos e runtime.

## Contrato de tarefa

Toda frente recebe estes campos, preenchidos a partir do pedido e do mapa:

| Campo | Conteudo obrigatorio |
| --- | --- |
| Identidade e objetivo | Alvo, homonimos excluidos, acervo ou decisao, finalidade |
| Perguntas e topicos | IDs de coverage, superficies responsaveis e fronteiras |
| Materiais iniciais | Fontes existentes, pistas e dependencias a consultar |
| Permissoes | Ferramentas disponiveis, somente leitura, restricoes e segredos |
| Orcamento | Limite da frente, limite global e regra de entrega parcial |
| Saida | Caminho exclusivo de notas ou contrato JSON no retorno |
| Retorno | Fontes, evidencias localizadas, afirmacoes, consultas reais, novas pistas e lacunas |
| Parada | Universo finito, saturacao demonstrada ou limite/bloqueio |

Instrucao curta de delegacao: "Investigue os topicos atribuidos usando somente
os acessos autorizados. Preserve trechos e localizadores, diferencie materiais
fornecidos de fontes visitadas, nao execute operacoes no alvo. Retorne os
registros do contrato do acervo e a fila restante, mesmo que a entrega seja parcial."

Nao delegue apenas "pesquise profundamente". Nao repasse segredos nem conteudo
privado desnecessario a outro agente ou provedor. Uma delegacao nao amplia acesso.

## Memoria e consolidacao

Cada pesquisador escreve apenas em seu proprio arquivo de notas/fragmento, usando
prefixos de IDs por frente (ex.: TEC-S1, TEC-E1, TEC-C1). Apenas o coordenador
atualiza o acervo canonico. Sem escrita, retorne o mesmo fragmento estruturado.

Ao consolidar, relacione IDs equivalentes, preserve o mapeamento de aliases e
nao renumere registros existentes. Unifique URLs comprovadamente equivalentes,
mantendo trechos e localizadores. Vincule republicacoes a derived_from; nao
some blogs e release original como tres confirmacoes independentes.

Se uma frente falhar, aproveite material ja persistido e mantenha pendencias.
Nao transforme tarefa disparada em tarefa concluida nem refaca automaticamente
uma chamada paga de resultado incerto. Registre erro, tentativas e proxima acao.
O coordenador recebe sintese curta e caminhos/IDs, nao apenas um resumo sem lastro.

## Ciclo adaptativo

A cada lote: consolidar registros, revisar novas pistas, resolver sobreposicoes,
redistribuir lacunas e atualizar cobertura. Dependencias tecnicas ou de acesso
viram depends_on. Um recurso novo pertinente abre topico; informacao apenas
curiosa fora do escopo vai para fila descartada com motivo, nao expansao silenciosa.

No modo acervo, percorra tambem os ramos secundarios pertinentes. Caso o limite
impeca isso, entregue-os como pendentes, sem esconder a reducao de cobertura.

## Auditoria antes da entrega

Quando houver capacidade autorizada, use um revisor que nao tenha escrito a
sintese. Ele consulta a evidencia, nao so o resumo dos pesquisadores. Sem agente
independente, realize segunda passagem sequencial identificada como tal.

O revisor devolve defeitos com topico, afirmacao, fonte, gravidade, motivo e
acao necessaria. Verifique:

- Inventario versus capitulos: ha modulo, anexo, versao, pagina ou plano omitido?
- Fila versus cobertura: ha pista aberta marcada como coberta ou descartada sem motivo?
- Afirmacoes versus trechos: o texto suporta exatamente a conclusao e seu alcance?
- Fontes versus origens: existe corroboracao real ou apenas republicacao?
- Interpretacoes alternativas, contraexemplos e contradicoes foram preservados?
- Houve confusao entre snippet, extracao parcial, fonte lida e funcionamento?
- Orcamento, dados sensiveis, links locais e motivo de encerramento estao corretos?

Defeito documental volta a coleta com consulta delta quando ha orcamento.
No limite, vira achado aberto na auditoria e entrega parcial. Nao maquie a
auditoria nem exija teste operacional para resolver falta de evidencia documental.