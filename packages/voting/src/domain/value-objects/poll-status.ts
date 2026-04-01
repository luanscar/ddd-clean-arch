export enum PollStatus {
  /** Rascunho, ainda não recebe votos. Configuração de opções. */
  DRAFT = 'DRAFT',
  /** Sessão aberta, recebendo votos ativamente. */
  OPEN = 'OPEN',
  /** Sessão encerrada, apuração finalizada. */
  CLOSED = 'CLOSED',
}
