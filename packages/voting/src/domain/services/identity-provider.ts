import type { TenantId, UniqueEntityId } from '@repo/shared-kernel'

/**
 * IUserContext — O contrato de como o contexto de Votação (Voting) 
 * enxerga um Usuário do sistema de Identidade.
 * 
 * Seguindo o padrão "Conformist/ACL" recomendado no relatório de auditoria, 
 * o Voting define o que precisa, não o que o Identity tem.
 */
export interface IUserContext {
  id: UniqueEntityId;
  tenantId: TenantId;
  roles: string[];
  isVerified: boolean;
}

/**
 * IIdentityProvider — Porta (Port) para o contexto de Identidade.
 * 
 * Este serviço de domínio permite que o motor de votação valide se um 
 * eleitor existe e está apto a votar sem acoplar o pacote 'voting' 
 * às entidades internas do pacote 'identity'.
 */
export interface IIdentityProvider {
  /**
   * Busca as informações contextuais de um usuário.
   */
  getUserById(userId: string, tenantId: string): Promise<IUserContext | null>;

  /**
   * Valida um token de sessão e retorna o contexto do usuário.
   */
  validateToken(token: string): Promise<IUserContext | null>;
}
