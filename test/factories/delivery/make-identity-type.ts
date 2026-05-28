import { faker } from '@faker-js/faker'
import {
  IdentificationType,
  IdentityDocument,
  IdentityDocumentProps,
} from '@/domain/delivery/enterprise/entities/value-objects/identity-document'

export function makeIdentityDocument(
  override: Partial<IdentityDocumentProps> = {},
) {
  const identitydocument = IdentityDocument.create({
    type: IdentificationType.PERSONAL_ID,
    number: faker.finance.accountNumber(),
    issuingCountry: faker.location.countryCode(),
    ...override,
  })

  return identitydocument
}
