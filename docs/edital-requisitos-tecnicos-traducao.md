# Tradução técnica do edital — Pregão / Termo de Referência

Este documento **não substitui** o [edital completo](edital%20sistema%20de%20votacao.md). Serve para **rastrear** o que o Termo de Referência exige (em especial **§ 4.0 — Requisitos da contratação**) até **camadas de software**, **bounded contexts** do monorepo e **tipos de artefato** (comandos, queries, portas, infra).

**Fonte principal no PDF/markdown:** Anexo I — Termo de Referência, itens **4.1** a **4.7** (módulos), mais **4.8–4.10** (manutenção, suporte, segurança/LGPD) e trechos de **§ 5** (execução, hospedagem), quando impactam arquitetura.

---

## 1. Legenda: camadas e tipos de artefato

| Símbolo / termo | Significado |
| :--- | :--- |
| **Domínio** | Entidades, VOs, invariantes, eventos de domínio, repositórios como *interfaces* |
| **Aplicação** | Comandos, queries, handlers, orquestração, **portas** (interfaces para fora do pacote) |
| **Infra** | Prisma, filas, e-mail, armazenamento de ficheiros, integrações HTTP, adaptadores de porta |
| **App / composição** | `apps/backend` (Nest), `apps/web`: controllers, guards, DI, registo de handlers, **BFF** |
| **Leitura / CQRS** | Query handlers, projeções, DTOs de leitura para painel e relatórios |
| **NFR** | Requisito não funcional (segurança, disponibilidade, LGPD) — políticas transversais |

**Bounded contexts** alinhados ao [`DOMAIN.md`](../DOMAIN.md): `identity`, `legislative`, `voting`, `shared-kernel`. O edital também exige **mídia ao vivo**, **painel público**, **integração com sistema legislativo externo** e **operação comercial** (NOC): parte disso é **nova capacidade na app/infra**, não necessariamente um pacote DDD com o nome do módulo do edital.

---

## 2. Requisitos gerais (§ 4.1)

| Item edital | Tradução técnica | Onde modelar |
| :--- | :--- | :--- |
| **a)** Equipamentos + software + tablet + TV | **Fora do núcleo DDD**: locação, *clients* (tablet/TV), apps ou modos de exibição; o **domínio** permanece agnóstico ao hardware | Plano de implantação + apps frontend/display |
| **b)** Sistema seguro, intuitivo, integrado ao processo legislativo | **Segurança**: authN/Z, TLS, validação, rate limit; **integração**: portas + eventos entre `legislative` ↔ `voting`; **UX**: web/apps | `identity` + `legislative` + `voting` + backend + web |
| **c)** Gravação, transmissão ao vivo, armazenamento de sessões | **Streaming/VOD**: fora dos três BCs centrais — serviço de mídia (ex.: RTMP/WebRTC), armazenamento de objetos, metadados de sessão podem ligar-se a `DeliberativeSession` por **ID** | Novo módulo **Media / Sessão audiovisual** (app + infra) ou integração com fornecedor |
| **d)** Suporte, manutenção preventiva/corretiva | **Operação contratual** + observabilidade do software (logs, healthchecks) | Runbook + CI/CD + monitorização; não é agregado de domínio |
| **e)** Segurança da informação, inviolabilidade do voto | **NFR**: criptografia em trânsito/repouso, segregação por `TenantId`, trilho de auditoria, regras de “voto secreto” vs nominal no modelo | Políticas em `voting` + infra + conformidade com item **4.9** |
| **f)** Acessibilidade (WCAG, leitores de ecrã, contraste) | **Frontend**: design system, testes de acessibilidade; APIs semânticas | `apps/web`, `packages/ui` |

---

## 3. Módulo Administrativo (§ 4.2.1)

| Item | Tradução técnica | Contexto / artefatos sugeridos |
| :--- | :--- | :--- |
| **a)** CRUD vereadores e suplentes | Cadastro de **parlamentares** por inquilino | `legislative`: agregado `Parliamentarian` (ou equivalente); comandos CRUD; repositório |
| **b)** CRUD administradores e operadores | **RBAC** + utilizadores com perfil | `identity`: `User` + papéis/claims; política “admin/operador” na app |
| **c)** CRUD partidos políticos | Entidade de apoio à bancada / composição política | `legislative`: novo agregado ou VO `PoliticalParty` + repositório |
| **d)** Histórico público/privado de votações e presenças **em tempo real** | **Duas superfícies**: (1) eventos + projeções para leitura; (2) canal em tempo real (SSE/WebSocket) | `voting`/`legislative`: eventos + **queries**; **infra**: publicação em tempo real; **política** pública vs privada em legislação/config |
| **e)** Integração legislativa automática com tramitação | Sincronização **resultado votação → processo legislativo** | `legislative`: handlers de integração (já no espírito de `sync-proposition-result`); **porta** para sistema externo se não for o teu modelo |
| **f)** Importação/exportação para outros sistemas | **Anti-Corruption Layer** + jobs ETL | Portas `IExportVotes`, `IImportAgenda`; formatos (CSV, JSON, API); **infra** |

---

## 4. Módulo Controle (§ 4.3)

| Item | Tradução técnica | Contexto / artefatos sugeridos |
| :--- | :--- | :--- |
| **a)** Ordem do Dia e expedientes a qualquer momento | Gestão de **pauta** da sessão | `legislative`: `DeliberativeSession` + itens/expedientes; comandos de composição de pauta |
| **b)** Importação do sistema legislativo sem redigitação | Integração **upstream** (ACL) | Porta `IImportLegislativeAgenda`; adapter HTTP/arquivo; mapeamento para expedientes |
| **c)** Tipos de expedientes | Catálogo tipado / enum extensível | `legislative`: VO ou tabela de tipos + regras |
| **d)** Anexos PDF aos itens | **Blob storage** + metadados | `legislative`: entidade `Attachment` (id, url, hash); infra S3/local |
| **e/f)** Troca vereador/suplente e presidente durante sessão | Transições de estado na sessão + vínculos | `legislative`: comandos `ReplaceParliamentarian`, `AssignSessionPresident`; invariantes |
| **g)** Quórum | Regra de sessão + agregação de presenças | `legislative`: serviço de domínio ou entidade `Quorum` ligada à sessão |
| **h/i/q)** Sorteio e uso da palavra, cronómetros | Máquina de estados / fila de pedidos + timers | `legislative`: `FloorRequest`, `SpeakingSlot`, política do regimento (parametrização) |
| **j/l/m/n)** Início/fim votação, secreto, bloco, aclamação, voto do presidente | Orquestração **legislativa** → **motor** | `legislative`: comandos que chamam `ICreateLegislativePoll` / fecho; `voting`: modos (`SECRET`, `BLOCK`, etc.) como VOs ou estratégias |
| **o)** Visualizar/imprimir resultados e presenças | Queries + PDF/print | **Leitura** + serviço de relatório (infra) |
| **r)** Clones de expedientes | Comando de duplicação | `legislative`: `CloneAgendaItem` |
| **s)** Logs de operações | **Auditoria** | Tabela `audit_log` (infra) + evento de aplicação; correlação com utilizador e tenant |

---

## 5. Módulo Vereadores (§ 4.4)

| Item | Tradução técnica | Contexto / artefatos sugeridos |
| :--- | :--- | :--- |
| **a–c)** Sessões, ordem do dia, PDFs | Queries autenticadas por perfil | `legislative` + `apps/web` |
| **d/h)** Sorteio e pedido de palavra | Comandos do parlamentar | `legislative` |
| **e/g)** Voto com biometria ou PIN; alterar voto antes do encerramento | **Autenticação forte** no **edge**; **regra** no motor: permitir alteração só com `Poll` aberta | `identity` / dispositivo: portas para verificação biométrica ou PIN; `voting`: comando `CastVote` / `ChangeVote` com invariantes |
| **f)** Presença (quórum) biométrica/PIN | Registo de presença verificável | `legislative`: `RegisterPresence` + timestamp |
| **i)** Painéis do plenário | **Leitura** + tempo real | Projeções + mesmo canal de *push* do painel |
| **j)** Videoconferência | Integração (Zoom/Meet/WebRTC) | **Infra + app**; ligação opcional a `sessionId` |

---

## 6. Módulo Presidente (§ 4.5)

| Item | Tradução técnica | Notas |
| :--- | :--- | :--- |
| **a)** Controlo simultâneo com Módulo Controle | **Mesmo backend**, políticas RBAC diferentes; *locks* opcionais para evitar conflito de comando | Camada **aplicação** + autorização |
| **b–g)** Igual vereador + visão global de pedidos de palavra | Papéis `PRESIDENT` com permissões extra | `identity` + `legislative` |

---

## 7. Módulo Painel de votação (§ 4.6) — público

| Item | Tradução técnica | Onde |
| :--- | :--- | :--- |
| **a)** Tempo real para população | **Canal público** (WebSocket/SSE) + projeções **sem dados sensíveis** se política exigir | `apps/web` página pública + backend *gateway* de leitura |
| **b)** Votos por vereador e **nominal** | **Decisão legal/produto**: exposição nominal; modelo de leitura dedicado | Query `GetNominalTally` + autorização **pública** explícita |
| **c–d)** Tempo de fala, tribuna, palavra, presença | DTOs de leitura da `legislative` + *stream* | `legislative` projeções |
| **e)** Modo escuro do painel | **UI** | Tema no frontend do painel |

---

## 8. Módulo Relatórios (§ 4.7)

| Item | Tradução técnica | Onde |
| :--- | :--- | :--- |
| **a–d)** Relatórios votação, ausências, presenças, impressão | **Queries** pesadas + templates PDF | Camada leitura ou serviço de relatório na **infra**; fonte: `voting` + `legislative` |
| **e)** Exportação para sites externos | API estável ou ficheiros gerados | Porta + *adapter* HTTP/CSV |

---

## 9. Capacitação, manutenção, suporte (§ 4.7–4.8 e § 5.x)

| Tema | Tradução técnica |
| :--- | :--- |
| Treinamento ≥ 4 h | **Entregável operacional**; opcional: modo “demo tenant” no software |
| NOC, canais, SLA (2 h / 4 h / 24 h) | **Processo** + **runbooks**; métricas de disponibilidade do serviço |
| Hospedagem (§ 5.30.x: app, BD, ficheiros, DNS, DDoS) | **Arquitetura de deployment**: cloud, WAF, backup de BD, CDN para estáticos — **não** é pacote DDD |
| LGPD / confidencialidade | DPA, bases legais, minimização, **retention** de logs e vídeo, direitos do titular — **políticas** + implementação em infra |

---

## 10. Segurança da informação (§ 4.9)

| Exigência (resumo) | Tradução técnica |
| :--- | :--- |
| Criptografia armazenamento/tráfego | TLS 1.2+, encryção em repouso (BD, blobs); segredos em vault |
| Controlo de acesso | RBAC/ABAC, `TenantId` obrigatório em comandos |
| Registo de eventos e incidentes | `audit_log`, SIEM opcional, retenção definida |
| Trilha de auditoria | Imutabilidade pós-fecho em `voting`; *append-only* para votos |
| Vulnerabilidades periódicas | Pipeline SAST/Dependabot + testes de penetração programados |
| IoT / software seguro | Tablets/TV: hardening, atualizações; *supply chain* |

---

## 11. Matriz rápida: módulo do edital → pacote NPM

| Módulo edital | Pacotes / camadas principais |
| :--- | :--- |
| Administrativo | `identity`, `legislative`, integrações na **app** |
| Controle | `legislative` (núcleo), `voting` (via portas), **infra** (PDF, import) |
| Vereadores / Presidente | `legislative` + `voting` + `identity` + **web** |
| Painel público | **Leitura** + `voting`/`legislative` + tempo real na **infra** |
| Relatórios | **Leitura** + **infra** (PDF/export) |
| Transmissão/gravação | **Novo subsistema de mídia** ou SaaS terceiro |
| Suporte / hospedagem / LGPD | **Operação + infra + compliance** |

---

## 12. Como usar com o `mvp-sessao-votacao.md`

1. **IDs de rastreio:** a matriz completa **EDT ↔ MVP** está em [`mvp-sessao-votacao.md`](mvp-sessao-votacao.md) — **secção 10**. Usa `EDT-4.3.j` (etc.) em critérios de aceitação, PRs e issues.  
2. Para cada linha **Must** do MVP, indica o **ID EDT** e, se quiseres, o parágrafo do TR (ex.: `EDT-4.3.j` + `EDT-4.4.e`).  
3. Usa a coluna **“Tradução técnica”** das secções 2–8 deste ficheiro para preencher **comando/query/porta** na tabela de rastreio do MVP (secção 4 do `mvp-sessao-votacao.md`).  
4. Itens só de **contrato** (SLA, treino) ficam fora do código, mas entram no **DoD** da entrega — marcar como **NFR** na secção 10 do MVP.

---

## Aviso

Interpretação de edital tem **implicação legal e contratual**. Este documento é **apoio de engenharia** ao desenho do teu monorepo; valida requisitos críticos com assessoria jurídica da casa e com o **gestor do contrato** antes de assumir compromissos formais.
