/**
 * IClock — Abstração para passagem de tempo.
 *
 * Princípio DDD: O domínio nunca deve depender do relógio do sistema global (ex: `new Date()`)
 * diretamente. Depender de uma interface permite que os testes unitários viajem
 * no tempo ("Time Traveling") para validar regras que expiram (ex: Tokens, Assinaturas).
 */
export interface IClock {
  /** Retorna a data e hora atual. */
  now(): Date
}
