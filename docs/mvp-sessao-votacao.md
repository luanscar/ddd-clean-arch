# MVP — Sessão deliberativa e votação

Documento operacional para **detalhar requisitos** da fatia “sessão → urna → resultado”. O desenho estratégico e o glossário estão em [`../DOMAIN.md`](../DOMAIN.md).

## Como usar este arquivo

1. Preencha **Âmbito** e **Fora de âmbito** (MVP vs depois).
2. Para cada requisito, copie o bloco **Modelo de requisito** e atribua um ID (`MVP-01`, …).
3. Complete a **Tabela de rastreio** (contexto → comando/query → integração).
4. Atualize **Comandos, queries e portas** e **Eventos de integração** conforme você fechar decisões.
5. Mantenha **Decisões pendentes** alinhadas a ADRs ou issues.
6. Use os **IDs EDT-** (ver [seção 10](#10-rastreio-edital-edt--mvp)) para citar o Termo de Referência em PRs e critérios de aceitação.

---

## 1. Âmbito do MVP

**Objetivo da fatia (uma frase):**

> _(ex.: Permitir que, em uma sessão deliberativa de um inquilino, uma proposição na pauta abra uma urna no motor de votação, receba cédulas e reflita o resultado na proposição.)_

**Inclui (marcar e completar):**

- [ ] Configuração mínima de sessão deliberativa e itens de pauta (`DeliberativeSession`, `Proposition`).
- [ ] Abertura de votação legislativa → criação de `Poll` (porta `ICreateLegislativePoll`, comando `StartPropositionVoting`).
- [ ] Registro de voto no motor (`Poll` `OPEN`, uma cédula por eleitor por pauta).
- [ ] Encerramento da urna e apuração (`Tally`).
- [ ] Sincronização do resultado → estado da `Proposition` (handler de integração / evento).
- [ ] _(opcional MVP)_ Leitura para painel do operador ou público (somente o acordado na política de transparência).

**Fora de âmbito (deixar explícito para não estourar o MVP):**

- Uso da palavra, filas de oradores, tempos — _a menos que você abra um requisito próprio_.
- Presença e quórum formal — _idem_.
- Multi-urna simultânea na mesma sessão — _definir_.
- _(outros)_

---

## 2. Personas e permissões (resumo)

| Perfil | Pode (MVP) | Não pode (MVP) |
| :--- | :--- | :--- |
| Secretaria / Controle | _(preencher)_ | _(preencher)_ |
| Presidência | _(preencher)_ | _(preencher)_ |
| Vereador | _(preencher)_ | _(preencher)_ |
| Público (leitura) | _(preencher)_ | _(preencher)_ |

> Regra: todo comportamento sensível deve citar **inquilino (`TenantId`)** e perfil autenticado (`Identity`).

---

## 3. Modelo de requisito (copiar por cada MVP-XX)

### MVP-XX — _Título curto_

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must / Should / Could |
| **Ator** | _(ex.: Secretaria)_ |
| **Gatilho** | _(ex.: operador aciona “Abrir votação” no item da pauta)_ |
| **Resultado** | _(ex.: existe `Poll` OPEN vinculada à proposição; estado da proposição reflete “em votação”.)_ |

**Critérios de aceitação** _(testáveis; prefira Given/When/Then ou checklist)_:

1. Dado _(estado inicial)_, quando _(ação)_, então _(efeito observável)_.
2. Dado usuário sem permissão, quando _(ação)_, então rejeição com _(tipo de erro / código)_.
3. _(isolamento)_ Nenhum dado de outro inquilino é exposto ou alterado.

**Notas / dependências:** _(portas, eventos, limitações conhecidas)_

---

### MVP-01 — Abrir votação a partir de uma proposição — **EDT-4.3.j** (início)

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Secretaria ou Presidência _(definir)_ |
| **Gatilho** | Comando explícito de abertura sobre uma `Proposition` elegível na sessão |
| **Resultado** | `Poll` criada no **Voting**; `Proposition` associada e em estado de votação |

**Critérios de aceitação:**

1. Dada proposição em estado que permite abrir urna _(listar estados exatos)_, quando `StartPropositionVoting`, então retorna `pollId` e persistência consistente nos dois contextos _(definir: mesma transação vs eventual)_.
2. Dada proposição de outro inquilino, quando o mesmo comando, então falha com `NotFound` ou equivalente, sem vazar existência.
3. Dada urna já aberta para aquela proposição, quando repetir abertura, então _(definir: idempotente vs erro explícito)_.

**Notas:** Implementação atual: `StartPropositionVotingHandler` + `ICreateLegislativePoll`. O adapter `VotingCreateLegislativePollAdapter` chama `CreatePollHandler` e em seguida `OpenPollHandler`, de modo que a urna fique **OPEN** após o comando (não permanece em **DRAFT**).

---

### MVP-02 — Registrar cédula (voto) — **EDT-4.4.e**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Vereador (parlamentar autenticado) |
| **Gatilho** | Escolha de opção válida em `Poll` com status `OPEN` |
| **Resultado** | `Vote` registrado (imutável após fechamento da urna); contagem coerente com as regras do motor |

**Critérios de aceitação:**

1. Dada urna `OPEN`, quando parlamentar elegível vota uma única vez, então voto é aceito e associado a `pollId` + identidade do eleitor + `TenantId`.
2. Dado segundo voto do mesmo eleitor na mesma `Poll`, então rejeição explícita (invariante de unicidade).
3. Dada urna fechada ou parlamentar de outro inquilino, quando tentativa de voto, então rejeição sem alterar estado alheio.
4. Autenticação forte (PIN / biometria / fluxo definido com **Identity** e borda da aplicação) documentada no DoD.

**Notas:** `CastVoteHandler` + `Poll.castVote` em `@repo/voting`; **Identity** fornece “quem é o eleitor” (`voterId`).

---

### MVP-02b — Alterar voto antes do encerramento — **EDT-4.4.g**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must _(exigência do edital; confirmar com gestão jurídica)_ |
| **Ator** | Mesmo parlamentar que registrou o voto |
| **Gatilho** | Ação explícita de correção enquanto `Poll` permanece `OPEN` |
| **Resultado** | Última intenção válida passa a ser a considerada na apuração; trilha de auditoria preservada _(definir: substituição vs histórico)_ |

**Critérios de aceitação:**

1. Dada `Poll` `OPEN` e voto já registrado pelo eleitor, quando solicitar alteração para outra opção permitida, então apuração reflete apenas o voto final antes do fechamento.
2. Dada `Poll` já fechada, quando tentativa de alteração, então rejeição.
3. Eventos/logs permitem reconstruir, para auditoria, que houve alteração (sem violar regra de inviolabilidade **após** o encerramento — **EDT-4.1.e**).

**Notas:** `ChangeVoteHandler` + `Poll.changeVote`; domínio emite `VoteChangedEvent` (`VOTING.VOTE_CHANGED`) só quando a opção muda; `HasNotVotedError` se ainda não houve cédula.

---

### MVP-03 — Encerrar urna e apurar — **EDT-4.3.j** (encerramento)

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Secretaria ou Presidência _(definir; alinhar a D1)_ |
| **Gatilho** | Comando explícito de encerramento da votação |
| **Resultado** | `Poll` deixa de aceitar votos; `Tally` consolidado e imutável conforme regras do domínio |

**Critérios de aceitação:**

1. Dada urna `OPEN`, quando encerramento autorizado, então nenhum novo voto ou alteração é aceito.
2. Apuração disponível para leitura (query) com isolamento por `TenantId`.
3. Integração dispara evento/porta para **MVP-04** (`PollClosedEvent` já carrega `TallyResult`).

**Notas:** `ClosePollHandler` + `Poll.close` em `@repo/voting`.

---

### MVP-04 — Sincronizar resultado com proposição / tramitação — **EDT-4.2.1.e**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Sistema (handler de integração) ou operador, conforme desenho |
| **Gatilho** | Encerramento da `Poll` ou evento de domínio/integração equivalente |
| **Resultado** | Estado da `Proposition` (e metadados necessários à “consulta pública”) reflete o resultado da urna |

**Critérios de aceitação:**

1. Dado fechamento com resultado conhecido, quando o handler roda, então `Proposition` atinge estado final coerente (aprovada/rejeitada/etc.) **no mesmo inquilino**.
2. Falhas de integração não corrompem `Tally` no **Voting**; retentativas ou DLQ _(definir)_.
3. Payload de integração é mínimo (ids + resultado agregado), sem acoplamento indevido entre modelos internos.

**Notas:** Padrão existente: `SyncPropositionResultOnPollClosed` (`sync-proposition-result.handler.ts`). No `apps/backend`, o handler é registado no **mesmo** `InProcessDomainEventDispatcher` global (`APP_DOMAIN_EVENT_DISPATCHER`) para o evento `VOTING.POLL_CLOSED`.

---

### MVP-05 — Cadastro de vereadores e suplentes — **EDT-4.2.1.a**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Administrador ou operador autorizado |
| **Gatilho** | CRUD em cadastro parlamentar |
| **Resultado** | Parlamentares disponíveis para vinculação à sessão e para elegibilidade de voto |

**Critérios de aceitação:**

1. Operações respeitam `TenantId`; não há leitura/escrita cruzada entre inquilinos.
2. Campos obrigatórios e regras de suplência _(definir com a Câmara)_ documentados.
3. Exclusão ou desativação não apaga histórico de votações já registrado _(definir política: soft delete)_.

**Notas:** Pacote `legislative` — ex.: `RegisterParliamentarian` e repositórios associados.

---

### MVP-06 — Administradores e operadores do sistema — **EDT-4.2.1.b**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Administrador global do inquilino _(definir hierarquia)_ |
| **Gatilho** | CRUD de usuários com papéis `ADMIN` / `OPERATOR` (ou equivalente) |
| **Resultado** | Autorização aplicada em rotas/comandos sensíveis no backend |

**Critérios de aceitação:**

1. Papéis distinguem o que só operador faz vs só admin _(matriz RBAC mínima)_.
2. Credenciais e segredos seguem boas práticas (hash, JWT, etc.) no **Identity** + **apps/backend**.
3. Alteração de permissões gera trilha auditável _(ligar a **EDT-4.3.s** quando existir)_.

---

### MVP-07 — Painel / histórico em tempo real (público e privado, nominal) — **EDT-4.2.1.d**, **EDT-4.6.a-b**, **EDT-4.4.i**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Should _(pode subir para Must se o edital for critério de aceite da entrega)_ |
| **Ator** | Cidadão (público), operador (privado), parlamentar (painel do plenário) |
| **Gatilho** | Eventos de sessão/votação ou polling/subscription |
| **Resultado** | Visualização atualizada de andamento, totais e _(se política pública assim exigir)_ voto nominal por parlamentar |

**Critérios de aceitação:**

1. Canal tempo real (WebSocket/SSE/outro) ou estratégia aceita documentada; latência alvo _(definir)_.
2. Visão **pública** não expõe dados além do permitido pela política (LGPD + transparência legislativa).
3. Visão **privada** exige autenticação/autorização adequadas.
4. Dados derivam de projeções/leitura; não quebram invariantes de escrita do **Voting**.

---

### MVP-08 — Ordem do dia e expedientes — **EDT-4.3.a**, **EDT-4.3.c**, **EDT-4.4.a-c**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Secretaria / Controle |
| **Gatilho** | Montagem e edição da pauta da `DeliberativeSession` |
| **Resultado** | Itens ordenados, tipados e consultáveis por vereador e painéis |

**Critérios de aceitação:**

1. CRUD de itens de pauta com tipos de expediente suportados pelo produto.
2. Queries para “sessões cadastradas”, “ordem do dia” e anexos _(PDF em backlog separado se **EDT-4.3.d** for fase 2)_.
3. Encadeamento natural com **MVP-01** (só itens elegíveis abrem urna).

---

### MVP-09 — Relatórios, impressão e exportação básica — **EDT-4.3.o**, **EDT-4.7.a-d**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Should |
| **Ator** | Operador ou administrador |
| **Gatilho** | Solicitação de relatório por sessão ou intervalo de datas |
| **Resultado** | Arquivo imprimível (PDF) ou equivalente com votações, ausências na votação e presenças _(conforme dados disponíveis no MVP)_ |

**Critérios de aceitação:**

1. Relatórios respeitam `TenantId` e perfil.
2. Exportação para sistemas externos (**EDT-4.7.e**) pode ficar em fase posterior; documentar o que entra no MVP.
3. Performance aceitável para o volume esperado da Câmara _(definir NFR)_.

---

## 4. Tabela de rastreio (requisito → contexto → API de domínio)

Opcional: coluna **EDT** com IDs da [seção 10](#10-rastreio-edital-edt--mvp).

| ID | EDT (opc.) | Requisito (título) | Contexto principal | Agregado / conceito | Comando ou query | Integração (porta / evento) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| MVP-01 | EDT-4.3.j | Abrir votação (início) | legislative + voting | `Proposition`, `Poll` | `StartPropositionVoting` | `ICreateLegislativePoll` |
| MVP-02 | EDT-4.4.e | Registrar cédula | voting | `Poll`, `Vote` | `CastVoteHandler` / `CastVoteCommand` | `Poll.castVote`; evento `VOTING.VOTE_CAST` |
| MVP-02b | EDT-4.4.g | Alterar voto (urna aberta) | voting | `Poll`, `Vote` | `ChangeVoteHandler` / `ChangeVoteCommand` | `Poll.changeVote`; evento `VOTING.VOTE_CHANGED` |
| MVP-03 | EDT-4.3.j | Encerrar urna / apurar | voting | `Poll`, `Tally` | `ClosePollHandler` / `ClosePollCommand` | `PollClosedEvent` → MVP-04 |
| MVP-04 | EDT-4.2.1.e | Sync resultado → proposição | voting → legislative | `Proposition` | handler | `sync-proposition-result` |
| MVP-05 | EDT-4.2.1.a | CRUD vereadores/suplentes | legislative | `Parliamentarian` | ex. `RegisterParliamentarian` | — |
| MVP-06 | EDT-4.2.1.b | CRUD admins/operadores | identity + app | `User`, papéis | _(comandos identity)_ | RBAC no backend |
| MVP-07 | EDT-4.2.1.d, 4.6, 4.4.i | Painel / tempo real / nominal | leitura + infra | projeções | queries + push | WebSocket/SSE |
| MVP-08 | EDT-4.3.a,c + 4.4.a-c | Ordem do dia / expedientes | legislative | `DeliberativeSession`, itens | _(comandos pauta)_ | — |
| MVP-09 | EDT-4.3.o + 4.7 | Relatórios / impressão | leitura + infra | — | queries + gerador PDF | opcional export |

---

## 5. Comandos, queries e portas (inventário do MVP)

Preencha com os nomes **reais** do código quando existirem.

### Legislative

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| Comando | `StartPropositionVoting` | _(já existe)_ |
| Comando | _(ex.: `RegisterParliamentarian`)_ | _(se aplicável ao MVP)_ |
| Query | _(ex.: pauta da sessão)_ | _(preencher)_ |
| Porta | `ICreateLegislativePoll` | _(já existe)_ |

### Voting

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| Comando | `CreatePollHandler` | Criar urna em `DRAFT` |
| Comando | `OpenPollHandler` | Abrir urna (`DRAFT` → `OPEN`) |
| Comando | `CastVoteHandler` | Registrar cédula (**MVP-02**) |
| Comando | `ChangeVoteHandler` | Alterar cédula com urna aberta (**MVP-02b**) |
| Comando | `ClosePollHandler` | Encerrar e obter `TallyResult` (**MVP-03**) |
| Query | `GetPollByIdHandler` | Leitura por id (painel/operador) |

### Identity

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| _(queries usadas pelo voting)_ | | |

---

## 6. Eventos de integração (contratos mínimos)

Definir **nome estável**, **produtor**, **consumidor** e **payload mínimo** (sem vazar modelo interno do outro contexto).

| Evento (nome canônico) | Produtor | Consumidor | Payload mínimo |
| :--- | :--- | :--- | :--- |
| `VOTING.VOTE_CAST` | `Poll` | projeções / painel | `pollId`, `voterId`, opção, instante |
| `VOTING.VOTE_CHANGED` | `Poll` | auditoria / painel | `pollId`, `voterId`, opção anterior, nova opção |
| `VOTING.POLL_CLOSED` (`PollClosedEvent`) | `Poll` | legislative (**MVP-04**) | `pollId`, `tenantId`, `TallyResult` |
| _(integração explícita opcional)_ | voting | legislative | `tenantId`, `pollId`, `propositionId`?, resultado agregado |

---

## 7. Leitura pública / tempo real _(se entrar no MVP)_

| Decisão | Escolha |
| :--- | :--- |
| O painel mostra apenas totais agregados? | Sim / Não |
| Voto nominal visível ao público? | Sim / Não / Só autenticado |
| Canal técnico (SSE, WebSocket, Socket.IO, polling) | _(infra; não é regra de domínio)_ |

**Queries ou projeções necessárias:** _(listar)_

---

## 8. Decisões pendentes

| # | Pergunta | Opções | Decisão | Data |
| :--- | :--- | :--- | :--- | :--- |
| D1 | Quem pode abrir urna? | Só presidência / Secretaria / ambos | | |
| D2 | Consistência legislative↔voting na abertura | Mesma transação vs sagas vs eventual | | |
| D3 | _(outra)_ | | | |

---

## 9. Verificação antes de implementar

- [ ] Cada requisito Must tem critérios de aceitação numerados.
- [ ] Cada linha da tabela de rastreio tem contexto e comando/query.
- [ ] Eventos de integração não expõem agregados inteiros entre pacotes.
- [ ] `TenantId` aparece em todos os fluxos sensíveis.
- [ ] Itens “fora de âmbito” não estão escondidos em requisitos vagos.
- [ ] Cada requisito Must, quando aplicável, referencia pelo menos um **EDT-** na tabela da seção 10.

---

## 10. Rastreio Edital (EDT) ↔ MVP

**Convenção de ID:** `EDT-<seção TR>.<subseção>.<letra>` conforme o [Termo de Referência](edital%20sistema%20de%20votacao.md) (Anexo I). Itens agrupados na [tradução técnica](edital-requisitos-tecnicos-traducao.md) usam sufixo composto (ex.: `EDT-4.3.j-l`).

**Coluna MVP sugerido:** liga ao teu `MVP-XX` quando existir; `—` se ainda não mapeado; **`NFR`** = não funcional/contrato; **`Mídia`** = subsistema fora dos BCs centrais.

| ID EDT | Referência TR | Resumo (objeto do edital) | MVP sugerido | Fase |
| :--- | :--- | :--- | :--- | :--- |
| EDT-4.1.a | 4.1 a | Equipamentos + software + tablet + TV | — | Implantação / fora do núcleo DDD |
| EDT-4.1.b | 4.1 b | Sistema de votação seguro, integrado ao legislativo | MVP-01 … MVP-04 | Core |
| EDT-4.1.c | 4.1 c | Gravação, transmissão ao vivo, armazenamento de sessões | — | Mídia |
| EDT-4.1.d | 4.1 d | Suporte e manutenção de equipamentos e software | NFR | Contrato / operação |
| EDT-4.1.e | 4.1 e | Segurança da informação, inviolabilidade dos votos | NFR | Transversal |
| EDT-4.1.f | 4.1 f | Acessibilidade | NFR | Web / UI |
| EDT-4.2.1.a | 4.2.1 a | CRUD vereadores e suplentes | MVP-05 | Legislative |
| EDT-4.2.1.b | 4.2.1 b | CRUD administradores e operadores | MVP-06 | Identity + app |
| EDT-4.2.1.c | 4.2.1 c | CRUD partidos políticos | — | Pós-MVP |
| EDT-4.2.1.d | 4.2.1 d | Histórico votações/presenças (público/privado) em tempo real | MVP-07 | Leitura + realtime |
| EDT-4.2.1.e | 4.2.1 e | Integração legislativa: resultados → tramitação / consulta pública | MVP-03 / MVP-04 | Integração |
| EDT-4.2.1.f | 4.2.1 f | Importação/exportação para outros sistemas legislativos | — | Integração |
| EDT-4.3.a | 4.3 a | Ordem do Dia e expedientes | MVP-08 | Legislative |
| EDT-4.3.b | 4.3 b | Importação do sistema legislativo (sem redigitação) | — | ACL / ETL |
| EDT-4.3.c | 4.3 c | Tipos de expedientes | MVP-08 | Legislative |
| EDT-4.3.d | 4.3 d | Anexos PDF aos itens | — | Infra |
| EDT-4.3.e | 4.3 e | Alteração vereador/suplente durante sessão | — | Legislative |
| EDT-4.3.f | 4.3 f | Alteração do Presidente da Sessão | — | Legislative |
| EDT-4.3.g | 4.3 g | Controle de quórum | — | Pós-MVP |
| EDT-4.3.h | 4.3 h | Sorteio eletrônico uso da palavra | — | Pós-MVP |
| EDT-4.3.i | 4.3 i | Parametrização uso da palavra (regimento) | — | Pós-MVP |
| EDT-4.3.j | 4.3 j | Início e finalização da votação eletrônica | MVP-01 / MVP-03 | Core |
| EDT-4.3.l | 4.3 l | Votação secreta, em bloco ou destaque | — | Voting + Legislative |
| EDT-4.3.m | 4.3 m | Votação por aclamação (controlador) | — | Pós-MVP |
| EDT-4.3.n | 4.3 n | Votação do presidente da Casa | — | Pós-MVP |
| EDT-4.3.o | 4.3 o | Visualização/impressão resultados e presenças | MVP-09 | Relatórios |
| EDT-4.3.p | 4.3 p | Controle total uso da palavra | — | Pós-MVP |
| EDT-4.3.q | 4.3 q | Cronômetros palavra e sorteios | — | Pós-MVP |
| EDT-4.3.r | 4.3 r | Clones automatizados de expedientes | — | Pós-MVP |
| EDT-4.3.s | 4.3 s | Logs de operações | NFR | Auditoria / infra |
| EDT-4.4.a-c | 4.4 a–c | Sessões, ordem do dia, PDFs | MVP-08 | Web + queries |
| EDT-4.4.d | 4.4 d | Inscrição sorteio uso da palavra | — | Pós-MVP |
| EDT-4.4.e | 4.4 e | Votação via biometria ou PIN | MVP-02 | Voting + Identity |
| EDT-4.4.f | 4.4 f | Confirmação presença (quórum) biometria/PIN | — | Pós-MVP |
| EDT-4.4.g | 4.4 g | Alteração do voto antes do encerramento | MVP-02b | Voting |
| EDT-4.4.h | 4.4 h | Pedido de uso da palavra | — | Pós-MVP |
| EDT-4.4.i | 4.4 i | Painéis do plenário | MVP-07 | Leitura |
| EDT-4.4.j | 4.4 j | Videoconferência | — | Integração |
| EDT-4.5.a | 4.5 a | Presidente: controle simultâneo com módulo controle | — | RBAC / app |
| EDT-4.5.b-g | 4.5 b–g | Presidente: mesmas capacidades + pedidos de palavra | — | Legislative + voting |
| EDT-4.6.a | 4.6 a | Painel: tempo real para população | MVP-07 | Público |
| EDT-4.6.b | 4.6 b | Painel: votos por vereador e nominal | MVP-07 | Política + leitura |
| EDT-4.6.c-d | 4.6 c–d | Painel: tempo de fala, tribuna, palavra, presença | MVP-07 | Pós-MVP parcial |
| EDT-4.6.e | 4.6 e | Painel: modo escuro | — | UI |
| EDT-4.7.a-d | 4.7 a–d | Relatórios votação, ausências, presenças, impressão | MVP-09 | Relatórios |
| EDT-4.7.e | 4.7 e | Exportação relatórios para sites/sistemas externos | — | Infra |
| EDT-4.8.x | 4.8.x | Manutenção, NOC, SLA suporte | NFR | Contrato |
| EDT-4.9.x | 4.9.x | Segurança da informação e privacidade | NFR | Transversal |
| EDT-5.30.x | 5.30.x | Hospedagem (app, BD, arquivos estáticos, DNS, DDoS) | NFR | Deploy |

**Sugestão de renumerar MVP** (opcional, para alinhar ao edital): manter `MVP-01` como hoje; usar `MVP-02` = cédula; `MVP-02b` = alterar voto; `MVP-03` = fechar urna; `MVP-04` = sync proposição; `MVP-05`… conforme tabela acima — ou funde células num único MVP por *release*.

---

## Referências no repositório

- Tradução técnica do edital (Termo de Referência → camadas/contextos): [`edital-requisitos-tecnicos-traducao.md`](edital-requisitos-tecnicos-traducao.md).
- Estratégico: [`DOMAIN.md`](../DOMAIN.md) (seções 7–9).
- Legislative: `packages/legislative` — `StartPropositionVotingHandler`, `sync-proposition-result.handler.ts`, `ICreateLegislativePoll`.
- Voting: `packages/voting` — `CastVoteHandler`, `ChangeVoteHandler`, `ClosePollHandler`, `Poll.changeVote`, `VoteChangedEvent`.

## 11. Backend NestJS e Prisma (fluxo MVP)

Persistência padrão da aplicação em **`apps/backend`**:

- **Prisma:** modelos `Poll`, `PollVote`, `Proposition`, `Parliamentarian`, `DeliberativeSession`, `SessionAgendaItem` (enum `PollStatus` alinhado ao domínio). Migrações em `apps/backend/prisma/migrations/`.
- **Repositórios:** `PrismaPollRepository`, `PrismaPropositionRepository`, `PrismaParliamentarianRepository`, `PrismaDeliberativeSessionRepository`; mappers em `apps/backend/src/voting/mappers` e `apps/backend/src/legislative/mappers`.
- **Eventos:** `DomainEventsModule` (`@Global`) expõe `APP_DOMAIN_EVENT_DISPATCHER` — mesma instância usada por Identity, Voting e o registo de `SyncPropositionResultOnPollClosed` (ver `legislative-poll-closed.registration.ts`).

**Rotas HTTP (prefixo global `v1`, JWT):**

- `GET /v1/polls/:pollId` — consulta urna (resposta inclui `_links` conforme estado).
- `POST /v1/polls/:pollId/votes` — registrar cédula (`voterId` = utilizador do token); resposta inclui `_links`.
- `PATCH /v1/polls/:pollId/votes` — alterar voto com urna aberta.
- `PATCH /v1/polls/:pollId` — encerrar urna com corpo `{ "status": "CLOSED" }` (dispara sync legislativo); resposta **200** com `status`, `tally` e `_links`.
- `POST /v1/legislative/parliamentarians` — registrar parlamentar (`userId` Identity, `name`, `party?`, `role?`); **201** com `id` e `_links`.
- `GET /v1/legislative/parliamentarians` — listagem paginada (`page`, `limit`).
- `GET /v1/legislative/parliamentarians/:id` — detalhe.
- `POST /v1/legislative/propositions` — submeter proposição (`title`, `description`); autor = parlamentar resolvido pelo **JWT** (`authorUserId`); **201** com `id` e `_links`.
- `GET /v1/legislative/propositions/:propositionId` — detalhe.
- `POST /v1/legislative/sessions` — criar sessão deliberativa (`title`, `date` ISO, `presidentId` parlamentar); **201** com `id` e `_links`.
- `GET /v1/legislative/sessions` — listagem paginada.
- `GET /v1/legislative/sessions/:sessionId` — detalhe com `propositionIds` na pauta.
- `POST /v1/legislative/sessions/:sessionId/agenda-items` — incluir proposição na pauta (`propositionId`); **201**.
- `POST /v1/legislative/propositions/:propositionId/polls` — criar urna para a proposição (corpo opcional `{}` ou `{ "title"?: string }` reservado); resposta **201** com `pollId` e `_links`.

O inquilino segue o padrão dos outros e2e: cabeçalho **`x-tenant-id`** (ex.: `system`), quando aplicável ao stack de tenant da app.

**Teste E2E:** `apps/backend/test/voting-flow.e2e-spec.ts` — requer Postgres com **`DATABASE_URL`** válido e migrações aplicadas (`npx prisma migrate deploy` no diretório `apps/backend`). Comando: `npm run test:e2e` em `apps/backend`.

**Prisma P3005 (`migrate deploy` com schema “não vazio”):** `prisma db push` (incluindo `db:reset`) sincroniza o schema **sem** gravar histórico em `_prisma_migrations`. Depois disso, `migrate deploy` pode falhar. Para alinhar: use só **`migrate dev`** (dev) ou **`migrate deploy`** num banco vazio / já baselineado; ou faça [baseline](https://www.prisma.io/docs/guides/migrate/production-troubleshooting) se a BD já tiver as tabelas e você precisar adotar migrações sem dropar tudo.

Repositórios **in-memory** nos pacotes `@repo/voting` e `@repo/legislative` permanecem para **testes unitários** dentro dos pacotes, não para compor a app Nest em dev/prod.

**Backlog e marco Git:** [`backlog-mvp-proximos-passos.md`](backlog-mvp-proximos-passos.md) — tag anotada `mvp-sessao-votacao-backend-2026-04`.
