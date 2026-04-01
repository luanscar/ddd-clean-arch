/**
 * UserStatus — ciclo de vida de um usuário no contexto de identidade.
 *
 * ACTIVE              → pode autenticar, executar operações
 * INACTIVE            → desativado, não pode autenticar
 * PENDING_VERIFICATION → aguardando confirmação de e-mail
 */
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_VERIFICATION: 'pending_verification',
} as const

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus]
