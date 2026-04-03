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

> Regra: todo comportamento sensível deve citar **inquilino (`TenantId`)** e perfil autenticado (`Identity`).

### 2.1 Perfis de produto (RBAC alvo — MVP-06)

Nomes estáveis para implementação no **Identity** + guards no backend (podem coexistir com papéis “de mesa” na mesma pessoa).

| Código (produto) | Tradução ubíqua | Uso principal |
| :--- | :--- | :--- |
| `TENANT_ADMIN` | Administrador do inquilino | CRUD de utilizadores e operadores; cadastro parlamentar (MVP-05); políticas do tenant (fases futuras). |
| `PLENARY_OPERATOR` | Secretaria / módulo controle / operador de plenário | Montar sessão e pauta; submeter proposição em nome do processo (se aplicável); **acionar no sistema** abertura e encerramento de urna após condução da mesa (D1). |
| `PRESIDING_OFFICER` | Presidente da **sessão** (`DeliberativeSession.presidentId`) | Autoridade de condução do expediente; no MVP pode partilhar com o operador as mesmas ações sensíveis **ou** ficar só com leitura, conforme política do tenant (variância §2.5). |
| `PARLIAMENTARIAN` | Vereador (parlamentar com mandato no tenant) | Votar e alterar voto (urna aberta); consultar pauta/urna conforme rotas expostas. |
| `PUBLIC_VIEWER` | Cidadão / leitura pública | Apenas queries públicas quando existirem (MVP-07); sem escrita. |

### 2.2 Personas na mesa e no plenário (o que cada uma faz no MVP)

| Perfil | Pode (MVP) | Não pode (MVP) |
| :--- | :--- | :--- |
| **Secretaria / Controle** (`PLENARY_OPERATOR`) | Criar sessão e itens de pauta; registrar parlamentar; submeter proposição (fluxo atual); **abrir urna** e **encerrar urna** no sistema (§11); consultas operacionais (`GET` legislativo/votação necessários ao painel interno). | Votar em nome de terceiros; alterar cédula alheia; aceder a dados de outro `TenantId`. |
| **Presidência** (`PRESIDING_OFFICER`) | Mesmas ações sensíveis que o operador **se** a política do tenant o permitir (D1); em muitas casas só **autoriza** verbalmente e o operador clica — o produto deve permitir **restringir** teclado ao operador numa fase posterior. | Sem permissão explícita: não assumir que “Presidente da Câmara” fora da sessão é automaticamente `PRESIDING_OFFICER` de todas as sessões. |
| **Vereador** (`PARLIAMENTARIAN`) | `POST/PATCH` voto na urna aberta; `GET` da própria urna/pauta conforme API. | Abrir/fechar urna; cadastrar terceiros; mutações legislativas de secretaria (pauta/sessão) salvo regra explícita futura. |
| **Público (leitura)** (`PUBLIC_VIEWER`) | Leitura pública quando existir endpoint/anónimo (fora do escopo JWT atual). | Qualquer escrita ou leitura autenticada de operador. |

### 2.3 Atos institucionais × quem executa (síntese de RI / prática)

Leitura transversal de regimentos internos de câmaras municipais: **Mesa Diretora** (Presidente, Vice, Secretários) **preside** e **dirige** os trabalhos; **Secretário(ões)** apoiam leituras, ata e chamadas sob direção do Presidente; a **operação do sistema** de votação eletrónica costuma ficar com **secretaria legislativa / módulo controle / equipe técnica**, com **atos de autoridade** (declarar aberta votação, resultado) proferidos pelo Presidente no microfone. O produto separa **`PRESIDING_OFFICER`** (papel de sessão) de **`PLENARY_OPERATOR`** (execução no sistema), mesmo quando a mesma pessoa os detém.

| Ato institucional (típico no RI) | Executor formal frequente | No produto (MVP) |
| :--- | :--- | :--- |
| Dirigir / instalar sessão | Presidente da Mesa | `PRESIDING_OFFICER` + estado da `DeliberativeSession` |
| Ordem do dia / pauta | Secretaria sob Presidência | `PLENARY_OPERATOR` (comandos legislative) |
| Declarar aberta a votação (ato de voz) | Presidente | Fora do software; o clique que cria/abre `Poll` é `PLENARY_OPERATOR` ou `PRESIDING_OFFICER` (D1) |
| Operar registo de cédulas | Sistema + parlamentar | `PARLIAMENTARIAN` |
| Declarar resultado após apuração | Presidente proclama | `Tally` no **Voting**; sync **Legislative** (MVP-04) |

### 2.4 Rotas HTTP sensíveis (§11) × perfil mínimo (alvo pós MVP-06)

**Implementação (backend):** `@Roles` + `RolesGuard` nos controladores; matriz auxiliar em [`apps/backend/src/auth/rbac.constants.ts`](../apps/backend/src/auth/rbac.constants.ts). Papéis JWT = `UserRole` em `@repo/identity` (`admin`, `plenary_operator`, `parliamentarian`, `member`). **Gestão de papéis (MVP-06):** `PATCH /v1/users/:userId` restrito a `admin`, corpo `{ "role"?, "active"? }`; não é permitido despromover ou desativar o **último** administrador ativo do inquilino (código `IDENTITY.LAST_TENANT_ADMIN`).

| Área | Método / rota (resumo) | Perfil mínimo (alvo) |
| :--- | :--- | :--- |
| Identity | `PATCH /v1/users/:userId` (papel / ativo) | `TENANT_ADMIN` |
| Legislative | `POST /v1/legislative/parliamentarians` | `TENANT_ADMIN` ou `PLENARY_OPERATOR` |
| Legislative | `PATCH /v1/legislative/parliamentarians/:id`, `DELETE` (soft) | `TENANT_ADMIN` ou `PLENARY_OPERATOR` |
| Legislative | `GET /v1/legislative/parliamentarians`, `GET .../:id` | `PLENARY_OPERATOR`, `PRESIDING_OFFICER`, `PARLIAMENTARIAN` (leitura) |
| Legislative | `POST /v1/legislative/sessions`, `POST .../agenda-items` | `PLENARY_OPERATOR` (e/ou `PRESIDING_OFFICER` se política) |
| Legislative | `GET` sessões | Operadores + parlamentares (escopo a fechar com LGPD) |
| Legislative | `POST /v1/legislative/propositions` | `PARLIAMENTARIAN` (autor JWT) ou `PLENARY_OPERATOR` (se fluxo administrativo existir) |
| Legislative | `POST .../propositions/:id/polls` (abrir urna) | `PLENARY_OPERATOR` **ou** `PRESIDING_OFFICER` (D1) |
| Voting | `PATCH /v1/polls/:id` (encerrar) | Igual abertura (D1) |
| Voting | `POST/PATCH .../votes` | `PARLIAMENTARIAN` (eleitor = utilizador autenticado) |
| Voting | `GET /v1/polls/:id` | Operador + parlamentar + futuro `PUBLIC_VIEWER` conforme política |

### 2.5 Variância entre câmaras (parametrização futura)

- **Quem “manda abrir” no software:** algumas casas exigem que só a **Presidência** tenha botão; outras delegam integralmente à **Secretaria**. O produto deve suportar **política por tenant** (ex.: desativar `PLENARY_OPERATOR` para `POST .../polls`).
- **Ordem dos trabalhos:** há regimentos que antecipam a ordem do dia (“horário nobre”); o modelo de `DeliberativeSession` + itens deve permitir **ordem** e **tipos** sem assumir um único fluxo temporal.
- **Votação nominal / secreta / em bloco:** fora do núcleo atual; impacta painéis (MVP-07) e regras de exibição.

### 2.6 Fontes consultadas (Regimento Interno — abril/2026)

Consulta documental **não substitui** o RI da Câmara cliente; serve para alinhar vocabulário e variância.

- Câmara Municipal de João Pessoa (PB) — Regimento Interno (PDF, março/2025): [regimento_interno_2025-03.pdf](https://sapl.joaopessoa.pb.leg.br/media/sapl/public/normajuridica/2003/16638/regimento_interno_2025-03.pdf)
- Câmara Municipal do Recife (PE) — Regimento Interno (página institucional): [cml.pe.gov.br](https://www.cml.pe.gov.br/regimento_interno_camara.aspx)
- Câmara Municipal de Igarapé do Meio (MA) — Regimento Interno: [igarapedomeio.ma.leg.br](https://www.igarapedomeio.ma.leg.br/institucional/regimento-interno)

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
| **Ator** | `PLENARY_OPERATOR` ou `PRESIDING_OFFICER` _(alinhar a D1)_ |
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
| **Ator** | `PLENARY_OPERATOR` ou `PRESIDING_OFFICER` _(alinhar a D1)_ |
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

**Estado (backend):** CRUD HTTP em `LegislativeParliamentariansController` (`POST`/`GET`/`PATCH`/`DELETE` soft); campo `active` e listagem com `includeInactive=true` para staff; `GET .../:id` devolve **404** para mandato inativo quando o utilizador não é `admin` nem `plenary_operator` (evita fuga de metadados). Regras finas de suplência por Câmara permanecem **parametrizáveis** — o valor `SUBSTITUTE` em `ParliamentaryRole` cobre o caso base; detalhe regimentar = variância §2.5.

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

**Estado (backend):** Registo de utilizador com `role` opcional (`POST /v1/users`); listagem por inquilino (`GET /v1/users`, só `admin`); **`UpdateTenantUserHandler`** + `PATCH /v1/users/:userId` para alterar papel e/ou `active`; proteção de **último admin** ativo. Trilha de auditoria dedicada (EDT-4.3.s) fase posterior.

---

### MVP-07 — Painel / histórico em tempo real (público e privado, nominal) — **EDT-4.2.1.d**, **EDT-4.6.a-b**, **EDT-4.4.i**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Should _(pode subir para Must se o edital for critério de aceite da entrega)_ |
| **Ator** | Cidadão (público), operador (privado), parlamentar (painel do plenário) |
| **Gatilho** | Eventos de sessão/votação ou polling/subscription |
| **Resultado** | Visualização atualizada de andamento, totais e _(se política pública assim exigir)_ voto nominal por parlamentar |

**Estado (backend):** entregue em `apps/backend/src/realtime` — `PollReadService`, `PublicPollsController`, `PollPrivateSseController`, `NominalVotesController`, `PollRealtimeFanoutRegistration` + §7 e §11 do MVP.

**Critérios de aceitação:**

1. **Canal tempo real:** SSE (`text/event-stream`) documentado na §7; fallback de polling (`GET /v1/public/polls/:pollId/snapshot`, `GET /v1/polls/:pollId` autenticado). Latência em ordem de segundos no processo único (NFR na §7). Pós-MVP: WebSocket / Redis pub-sub (ver backlog).
2. Visão **pública** não expõe dados além do permitido pela política (LGPD + transparência legislativa) — snapshot e SSE só agregados; sem `voterId` no stream.
3. Visão **privada** exige autenticação/autorização adequadas — SSE autenticado e `GET .../nominal-votes` com papéis restritos.
4. Dados derivam de projeções/leitura (Prisma na app Nest); **não** alteram invariantes de escrita do **Voting**; fan-out regista-se em `APP_DOMAIN_EVENT_DISPATCHER`.

---

### MVP-08 — Ordem do dia e expedientes — **EDT-4.3.a**, **EDT-4.3.c**, **EDT-4.4.a-c**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Must |
| **Ator** | Secretaria / Controle |
| **Gatilho** | Montagem e edição da pauta da `DeliberativeSession` |
| **Resultado** | Itens ordenados, tipados e consultáveis por vereador e painéis |

**Estado (backend):** *slice texto + anexos bucket* — `SessionAgendaItem` com `title` / `description` (título obrigatório no domínio para tipos sem proposição); rotas de pauta existentes aceitam esses campos; anexos PDF por item via `POST/GET .../agenda-items/:itemId/attachments` com armazenamento em bucket S3-compatível (`S3ObjectStorageService`; **503** se o bucket não estiver configurado).

**Critérios de aceitação:**

1. CRUD de itens de pauta com tipos de expediente suportados pelo produto.
2. Queries para “sessões cadastradas”, “ordem do dia” e anexos PDF (metadados em Prisma; ficheiros no bucket).
3. Encadeamento natural com **MVP-01** (só itens elegíveis abrem urna).

---

### MVP-09 — Relatórios, impressão e exportação básica — **EDT-4.3.o**, **EDT-4.7.a-d**

| Campo | Conteúdo |
| :--- | :--- |
| **Prioridade** | Should |
| **Ator** | Operador ou administrador |
| **Gatilho** | Solicitação de relatório por sessão ou intervalo de datas |
| **Resultado** | Arquivo imprimível (PDF) ou equivalente com votações, ausências na votação e presenças _(conforme dados disponíveis no MVP)_ |

**Estado (backend):** **em desenvolvimento** — *slice 1* entregue: `GET /v1/legislative/sessions/:sessionId/report.pdf` (`SessionReportService` + `SessionReportPdfRenderer` em `apps/backend/src/reports`). Conteúdo atual: cabeçalho da sessão, pauta (inclui título de expediente quando existir), urnas ligadas com **apuração agregada** se `CLOSED`, e **bloco de presenças** quando houver registos em `session_attendance` (intervalo de datas / export externo — fases posteriores).

**Critérios de aceitação:**

1. Relatórios respeitam `TenantId` e perfil.
2. Exportação para sistemas externos (**EDT-4.7.e**) pode ficar em fase posterior; **no MVP:** PDF por sessão com dados no Prisma, incluindo presença manual quando registada.
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
| MVP-05 | EDT-4.2.1.a | CRUD vereadores/suplentes | legislative | `Parliamentarian` | `Register` / `Update` / `Deactivate` + queries | — |
| MVP-06 | EDT-4.2.1.b | CRUD admins/operadores | identity + app | `User`, papéis | `UpdateTenantUserHandler`; `POST /v1/users` com `role` | RBAC (`@Roles`, `rbac.constants`) |
| MVP-07 | EDT-4.2.1.d, 4.6, 4.4.i | Painel / tempo real / nominal | leitura + infra | projeções | `PollReadService` + SSE (`realtime`) | SSE + fallback polling (`GET /v1/polls/:id`) |
| MVP-08 | EDT-4.3.a,c + 4.4.a-c | Ordem do dia / expedientes | legislative | `DeliberativeSession`, itens, presença, anexos | comandos pauta + presença + `AgendaItemAttachmentService` | bucket S3 |
| MVP-09 | EDT-4.3.o + 4.7 | Relatórios / impressão | leitura + infra | — | `SessionReportService` + PDF (`reports`) | `GET .../sessions/:id/report.pdf`; fase 2: intervalo datas / export |

---

## 5. Comandos, queries e portas (inventário do MVP)

Preencha com os nomes **reais** do código quando existirem.

### Legislative

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| Comando | `StartPropositionVoting` | _(já existe)_ |
| Comando | _(ex.: `RegisterParliamentarian`)_ | _(se aplicável ao MVP)_ |
| Query | _(ex.: pauta da sessão)_ | _(preencher)_ |
| _(leitura na app Nest — MVP-09)_ | `SessionReportService` (`apps/backend/src/reports`) | PDF da sessão (Prisma; agregados de votação) |
| Porta | `ICreateLegislativePoll` | _(já existe)_ |

### Voting

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| Comando | `CreatePollHandler` | Criar urna em `DRAFT` |
| Comando | `OpenPollHandler` | Abrir urna (`DRAFT` → `OPEN`) |
| Comando | `CastVoteHandler` | Registrar cédula (**MVP-02**) |
| Comando | `ChangeVoteHandler` | Alterar cédula com urna aberta (**MVP-02b**) |
| Comando | `ClosePollHandler` | Encerrar e obter `TallyResult` (**MVP-03**) |
| Query | `GetPollByIdHandler` | Leitura por id (painel/operador; JWT) |
| _(leitura na app Nest)_ | `PollReadService` (`apps/backend/src/realtime`) | Snapshot público agregado + lista nominal (Prisma; sem alterar `@repo/voting`) |

### Identity

| Tipo | Nome | Responsabilidade |
| :--- | :--- | :--- |
| Comando | `UpdateTenantUserHandler` | Papel e/ou `active` por admin (**MVP-06**); último admin protegido |
| Query | `GetUsersHandler` | Listagem paginada por inquilino |
| _(queries usadas pelo voting)_ | _(JWT / perfil)_ | |

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

## 7. Leitura pública / tempo real _(MVP-07)_

| Decisão | Escolha |
| :--- | :--- |
| O painel mostra apenas totais agregados? | **Sim** no canal público: `status`, `title`, `allowedOptions`, `voteCount`, contagens por opção (`optionCounts`); com urna **fechada** inclui `tally` agregado. **Sem** `voterId`, sem lista nominal. |
| Voto nominal visível ao público? | **Não.** Nominal só com JWT e papéis `admin`, `plenary_operator` ou `parliamentarian` (`GET /v1/polls/:pollId/nominal-votes`), sempre filtrado por `tenantId`. |
| Canal técnico (SSE, WebSocket, polling) | **SSE primeiro** (`text/event-stream`): `GET /v1/public/polls/:pollId/events` (público, com `x-tenant-id`) e `GET /v1/polls/:pollId/events` (autenticado, mesmo hub de fan-out, payload agregado seguro). **Fallback:** polling com `GET /v1/public/polls/:pollId/snapshot` ou `GET /v1/polls/:pollId` (já existente, autenticado). WebSocket / Redis pub-sub ficam pós-MVP. |
| NFR (painel) | Latência alvo: atualização percebida em ordem de segundos após evento de domínio em processo único (MVP). Limite de pedidos ao snapshot público: **throttle dedicado** em memória por IP (separado do throttle geral de 10/min), p.ex. ~40 req/min por IP; ligações SSE: uma subscrição por cliente; heartbeats ~25 s para atravessar proxies. |

**Queries ou projeções necessárias:**

- Snapshot público: `PollReadService.getPublicSnapshot` → Prisma `poll` + agregados em `poll_votes` (por `tenantId` + `pollId`).
- Nominal: `PollReadService.listNominalVotes` → `poll_votes` + `users` / `parliamentarians` (nome legível), com `tenantId`.
- Tempo real: handlers registados em `APP_DOMAIN_EVENT_DISPATCHER` (`VOTING.POLL_OPENED`, `VOTING.VOTE_CAST`, `VOTING.VOTE_CHANGED`, `VOTING.POLL_CLOSED`) → `PollSseFanoutService` → `PollSseHubService` (mapa in-memory por `pollId`).

---

## 8. Decisões pendentes

| # | Pergunta | Opções | Decisão | Data |
| :--- | :--- | :--- | :--- | :--- |
| D1 | Quem pode abrir e encerrar urna no sistema? | Só presidência / Só secretaria-operador / Ambos | **Ambos** os perfis `PLENARY_OPERATOR` e `PRESIDING_OFFICER` estão autorizados às rotas de abertura (`POST .../polls` via `StartPropositionVoting`) e encerramento (`PATCH .../polls/:id`). `TENANT_ADMIN` fica para gestão de cadastros; uso para urna só em piloto/break-glass se documentado. Parametrização futura por tenant pode restringir a um único papel. | 2026-04-02 |
| D2 | Consistência legislative↔voting na abertura | Mesma transação vs sagas vs eventual | **Síncrono na mesma composição (Nest monólito):** o fluxo atual (`StartPropositionVoting` → `ICreateLegislativePoll` → `CreatePoll` + `OpenPoll`) permanece na mesma requisição; falhas devem expor erro à API e **evitar estado órfão** na Legislative (transação única ou compensação explícita no handler). **Sagas / consistência eventual** reservadas para quando Voting e Legislative estiverem desacoplados em processos ou filas. **UX:** operador vê falha imediata (5xx/4xx) e pode repetir de forma idempotente quando o domínio permitir. | 2026-04-02 |
| D3 | Política por tenant para “só Presidência clica” | Flag / config | **Backlog:** `allowPlenaryOperatorToOpenPoll` (nome indicativo) — quando `false`, apenas `PRESIDING_OFFICER` abre/fecha urna. | — |

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
| EDT-4.3.d | 4.3 d | Anexos PDF aos itens | MVP-08 | Infra (bucket S3) |
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

- **Prisma:** modelos `Poll`, `PollVote`, `Proposition`, `Parliamentarian` (campo `active` para soft delete do mandato), `DeliberativeSession`, `SessionAgendaItem` (`title`, `description`), `SessionAttendance`, `AgendaItemAttachment` (metadados de PDF no bucket), enum `PollStatus` alinhado ao domínio. Migrações em `apps/backend/prisma/migrations/`.
- **Repositórios:** `PrismaPollRepository`, `PrismaPropositionRepository`, `PrismaParliamentarianRepository`, `PrismaDeliberativeSessionRepository`; mappers em `apps/backend/src/voting/mappers` e `apps/backend/src/legislative/mappers`.
- **Eventos:** `DomainEventsModule` (`@Global`) expõe `APP_DOMAIN_EVENT_DISPATCHER` — mesma instância usada por Identity, Voting, `SyncPropositionResultOnPollClosed` (ver `legislative-poll-closed.registration.ts`) e **MVP-07** `PollRealtimeFanoutRegistration` (fan-out SSE na app, sem regra de urna).

**Rotas HTTP (prefixo global `v1`, JWT):**

- `GET /v1/public/polls/:pollId/snapshot` — painel **público**: agregados apenas; cabeçalho obrigatório **`x-tenant-id`**; **sem JWT**; throttle público dedicado.
- `GET /v1/public/polls/:pollId/events` — **SSE** público (`text/event-stream`): eventos `poll.opened`, `tally.updated`, `poll.closed` com payload agregado (sem identificação de eleitor); `x-tenant-id` obrigatório; heartbeats periódicos.
- `GET /v1/polls/:pollId/events` — **SSE** autenticado (`JwtAuthGuard` + `RolesGuard`): mesmos tipos de evento seguros; `tenantId` do JWT deve coincidir com o da urna; papéis de leitura legislativa (`admin`, `plenary_operator`, `parliamentarian`, `member`).
- `GET /v1/polls/:pollId/nominal-votes` — lista nominal (votante + opção + instante); **só** `admin`, `plenary_operator`, `parliamentarian`; isolamento por `tenantId`.
- `GET /v1/polls/:pollId` — consulta urna (resposta inclui `_links` conforme estado).
- `POST /v1/polls/:pollId/votes` — registrar cédula (`voterId` = utilizador do token); resposta inclui `_links`.
- `PATCH /v1/polls/:pollId/votes` — alterar voto com urna aberta.
- `PATCH /v1/polls/:pollId` — encerrar urna com corpo `{ "status": "CLOSED" }` (dispara sync legislativo); resposta **200** com `status`, `tally` e `_links`.
- `POST /v1/legislative/parliamentarians` — registrar parlamentar (`userId` Identity, `name`, `party?`, `role?` com `MEMBER` \| `PRESIDENT` \| `SECRETARY` \| `SUBSTITUTE`); **201** com `id` e `_links`.
- `GET /v1/legislative/parliamentarians` — listagem paginada (`page`, `limit`; `includeInactive=true` só para admin/plenary_operator).
- `GET /v1/legislative/parliamentarians/:id` — detalhe (campo `active`, `_links` com `update` / `deactivate`).
- `PATCH /v1/legislative/parliamentarians/:id` — atualização parcial (`name?`, `party?` vazio limpa, `role?`, `active?`); **200**.
- `DELETE /v1/legislative/parliamentarians/:id` — desativa mandato (**soft delete**); **200** (`active: false`). Presidente de nova sessão deve estar ativo (**422** se inativo).
- `POST /v1/legislative/propositions` — submeter proposição (`title`, `description`); autor = parlamentar resolvido pelo **JWT** (`authorUserId`); **201** com `id` e `_links`.
- `GET /v1/legislative/propositions/:propositionId` — detalhe.
- `POST /v1/legislative/sessions` — criar sessão deliberativa (`title`, `date` ISO, `presidentId` parlamentar); **201** com `id` e `_links`.
- `GET /v1/legislative/sessions` — listagem paginada.
- `GET /v1/legislative/sessions/:sessionId` — detalhe com `propositionIds`, `agendaItems` (com `title`/`description` quando aplicável) e `attendance`.
- `GET /v1/legislative/sessions/:sessionId/attendance` — lista de presenças (`parliamentarianId`, `recordedAt`).
- `POST /v1/legislative/sessions/:sessionId/attendance` — regista presença (`parliamentarianId`); **201**; `admin` / `plenary_operator`.
- `DELETE /v1/legislative/sessions/:sessionId/attendance/:parliamentarianId` — revoga presença; **204**.
- `GET /v1/legislative/sessions/:sessionId/quorum` — quórum MVP: maioria simples dos parlamentares **ativos** do tenant (`presentCount`, `eligibleCount`, `quorumRequired`, `met`).
- `GET /v1/legislative/sessions/:sessionId/report.pdf` — relatório **PDF** da sessão (pauta + apuração agregada das urnas fechadas + presenças quando existirem); **`x-tenant-id`** obrigatório; papéis `admin` / `plenary_operator` (**MVP-09**).
- `POST /v1/legislative/sessions/:sessionId/agenda-items` — incluir item na pauta (`propositionId` para votável; `type`, `title`, `description` conforme tipo); **201**.
- `PATCH /v1/legislative/sessions/:sessionId/agenda-items/:itemId` — atualizar tipo, proposição, título ou descrição.
- `PUT /v1/legislative/sessions/:sessionId/agenda-items/order` — reordenar pauta (`orderedItemIds`: lista completa de ids dos itens); **204**.
- `DELETE /v1/legislative/sessions/:sessionId/agenda-items/:itemId` — remover item da pauta; **204**.
- `GET /v1/legislative/sessions/:sessionId/agenda-items/:itemId/attachments` — listar anexos com URL pré-assinada de download (se S3 configurado).
- `POST /v1/legislative/sessions/:sessionId/agenda-items/:itemId/attachments` — `multipart/form-data` campo `file` (PDF); **503** se bucket não configurado; **201** com `id`, `fileName`, `downloadUrl`.
- `POST /v1/legislative/propositions/:propositionId/polls` — criar urna para a proposição (corpo opcional `{}` ou `{ "title"?: string }` reservado); resposta **201** com `pollId` e `_links`.

O inquilino segue o padrão dos outros e2e: cabeçalho **`x-tenant-id`** (ex.: `system`), quando aplicável ao stack de tenant da app.

**Teste E2E:** `apps/backend/test/voting-flow.e2e-spec.ts` — requer Postgres com **`DATABASE_URL`** válido e migrações aplicadas (`npx prisma migrate deploy` no diretório `apps/backend`). Comando: `npm run test:e2e` em `apps/backend`.

**Prisma P3005 (`migrate deploy` com schema “não vazio”):** `prisma db push` (incluindo `db:reset`) sincroniza o schema **sem** gravar histórico em `_prisma_migrations`. Depois disso, `migrate deploy` pode falhar. Para alinhar: use só **`migrate dev`** (dev) ou **`migrate deploy`** num banco vazio / já baselineado; ou faça [baseline](https://www.prisma.io/docs/guides/migrate/production-troubleshooting) se a BD já tiver as tabelas e você precisar adotar migrações sem dropar tudo.

Repositórios **in-memory** nos pacotes `@repo/voting` e `@repo/legislative` permanecem para **testes unitários** dentro dos pacotes, não para compor a app Nest em dev/prod.

**Backlog e marco Git:** [`backlog-mvp-proximos-passos.md`](backlog-mvp-proximos-passos.md) — tag anotada `mvp-sessao-votacao-backend-2026-04`.
