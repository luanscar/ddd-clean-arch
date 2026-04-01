/**
 * @repo/shared-kernel
 *
 * Shared Kernel DDD — primitivos táticos compartilhados entre todos os
 * Bounded Contexts do sistema.
 *
 * Importação por sub-path (recomendado para tree-shaking):
 *   import { Entity, AggregateRoot } from '@repo/shared-kernel/domain'
 *   import { Result, Guard }         from '@repo/shared-kernel/helpers'
 *   import { IUseCase }              from '@repo/shared-kernel/application'
 *   import { AbstractMapper }        from '@repo/shared-kernel/infrastructure'
 *
 * Importação via barrel único (conveniente em contextos menores):
 *   import { Entity, Result, IUseCase } from '@repo/shared-kernel'
 */

// ─── Helpers (sem dependências internas) ─────────────────────────────────────
export * from './helpers/index.js'

// ─── Domain (depende apenas de helpers) ──────────────────────────────────────
export * from './domain/index.js'

// ─── Application (depende de domain e helpers) ───────────────────────────────
export * from './application/index.js'

// ─── Infrastructure (depende de domain e helpers) ────────────────────────────
export * from './infrastructure/index.js'
