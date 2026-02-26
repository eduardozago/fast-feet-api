import { ValueObject } from '@/core/entities/value-object'

export const IdentificationType = {
  PERSONAL_ID: 'PERSONAL_ID',
  TAX_ID: 'TAX_ID',
  PASSPORT: 'PASSPORT',
  COMPANY_ID: 'COMPANY_ID',
  OTHER: 'OTHER',
} as const

export type IdentificationType =
  (typeof IdentificationType)[keyof typeof IdentificationType]

export interface IdentityDocumentProps {
  type: IdentificationType
  number: string
  issuingCountry: string // ISO 3166-1 alpha-2
}

export class IdentityDocument extends ValueObject<IdentityDocumentProps> {
  get type() {
    return this.props.type
  }

  get number() {
    return this.props.number
  }

  get issuingCountry() {
    return this.props.issuingCountry
  }

  static create(props: IdentityDocumentProps) {
    return new IdentityDocument(props)
  }
}
