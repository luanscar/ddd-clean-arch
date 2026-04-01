
/**
 * ValueObjectProps — restringe as props de um VO para objetos planos.
 * Usa `object` com exclusão de primitivos para aceitar interfaces seladas
 * (inclusive com Brand types) sem exigir index signature.
 */
export type ValueObjectProps = object

/**
 * ValueObject<Props> — Classe base abstrata para Value Objects.
 *
 * Características DDD obrigatórias:
 *  - Sem identidade: dois VOs com as mesmas props são iguais (igualdade estrutural)
 *  - Imutáveis: props congeladas em runtime + readonly em tipo
 *  - Auto-validação: a lógica de criação fica em factory methods estáticos
 *
 * @example
 *   interface MinutesProps { value: number }
 *
 *   class Minutes extends ValueObject<MinutesProps> {
 *     get value() { return this.props.value }
 *
 *     static create(n: number): Result<Minutes, ValidationError> {
 *       if (n < 0) return Result.fail(new ValidationError('Minutes must be >= 0'))
 *       return Result.ok(new Minutes({ value: n }))
 *     }
 *   }
 */
export abstract class ValueObject<Props extends ValueObjectProps> {
  /**
   * Props imutáveis em tipo (DeepReadonly) e congeladas em runtime.
   * Acesse somente via getters nos subtipos.
   */
  protected readonly props: Readonly<Props>

  protected constructor(props: Props) {
    // Garante imutabilidade em runtime — não apenas em tipo
    this.props = Object.freeze({ ...props }) as Readonly<Props>
  }

  /**
   * Igualdade estrutural: dois VOs são iguais se e somente se
   * têm o mesmo tipo e as mesmas props (deep equality via JSON).
   *
   * Limitação: não funciona para props com Date, Symbol ou referências circulares.
   * Subtipos podem sobrescrever para comparações especializadas.
   */
  equals(other?: ValueObject<Props>): boolean {
    if (other === null || other === undefined) return false
    if (!(other instanceof this.constructor)) return false
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }

  /**
   * Retorna uma nova instância com as props mescladas.
   * Útil para "atualizar" um VO sem mutar o original.
   *
   * Subtipos devem sobrescrever se precisarem de validação na atualização.
   */
  protected with(partialProps: Partial<Props>): this {
    // Monta as props mescladas e cria nova instância via reflexão
    const Constructor = this.constructor as new (props: Props) => this
    return new Constructor({ ...(this.props as Props), ...partialProps })
  }
}
