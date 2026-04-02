import type { Result, UniqueEntityId, DomainError } from '@repo/shared-kernel'

/**
 * Porta — o contexto Legislative define o contrato; o Voting é acoplado via adapter na composição.
 */
export interface CreateLegislativePollInput {
  title: string
  allowedOptions: string[]
  tenantId: string
}

export interface ICreateLegislativePoll {
  create(input: CreateLegislativePollInput): Promise<Result<UniqueEntityId, DomainError>>
}
