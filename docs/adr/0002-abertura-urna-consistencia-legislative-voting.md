# ADR-0002: Consistência entre Legislative e Voting na abertura de urna (D2)

## Status

Aceite — 2026-04-02

## Contexto

- A abertura de votação **origina** no contexto legislativo (`StartPropositionVoting`) e **invoca** o contexto de votação (`CreatePoll`, `OpenPoll`) através da porta `ICreateLegislativePoll`.
- Alternativas clássicas: **mesma transação**, **saga com compensação**, ou **consistência eventual** (filas, processos separados).
- No MVP, a aplicação é um **monólito Nest** com ambos os bounded contexts em pacotes internos e persistência Prisma partilhada na app.

## Decisão

1. No MVP, o fluxo **`StartPropositionVoting` → `ICreateLegislativePoll` → criação e abertura da `Poll`** executa-se no **mesmo pedido HTTP** (mesma composição de aplicação), de forma **síncrona** do ponto de vista do cliente.

2. **Erros** de qualquer etapa devem propagar-se como **resposta HTTP 4xx/5xx** clara; o operador **não** assume sucesso parcial opaco.

3. O desenho deve **evitar estado órfão** na Legislative (proposição ou pauta indicando votação sem `Poll` válida, ou o inverso incoerente). Isto pode implicar transação única Prisma, compensação explícita no handler, ou idempotência documentada — a escolha concreta de mecanismo fica na implementação, mantendo o **contrato** acima.

4. **Sagas**, **outbox** ou **consistência eventual** entre processos distintos ficam **explicitamente fora** do MVP e serão reconsideradas se Legislative e Voting forem desacoplados em serviços ou filas.

## Consequências

- Simplicidade operacional e de testes e2e no marco atual.
- Escalabilidade horizontal “puramente stateless” pode exigir revisão deste ADR quando houver múltiplas instâncias sem partilha de transação.
- Retentativas e DLQ para **outros** fluxos (ex.: **MVP-04** sync após fecho) são assunto separado e podem ter ADR ou política própria.

## Referências

- [`docs/mvp-sessao-votacao.md`](../mvp-sessao-votacao.md) §8 (D2)
- Integração MVP-04 (resultado → proposição) após encerramento da urna
