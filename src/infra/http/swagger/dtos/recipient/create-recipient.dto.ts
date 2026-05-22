import { ApiProperty } from '@nestjs/swagger'

class IdentityDocumentDto {
  @ApiProperty({
    enum: ['PERSONAL_ID', 'TAX_ID', 'PASSPORT', 'COMPANY_ID', 'OTHER'],
    example: 'TAX_ID',
    description:
      'Document type. `PERSONAL_ID` for national IDs, `TAX_ID` for tax/fiscal IDs (e.g. NIF, EIN, SSN), `PASSPORT` for travel documents.',
  })
  type: 'PERSONAL_ID' | 'TAX_ID' | 'PASSPORT' | 'COMPANY_ID' | 'OTHER'

  @ApiProperty({
    example: '123-45-6789',
    description: 'Document number as it appears on the physical document.',
  })
  number: string

  @ApiProperty({
    example: 'US',
    description:
      'ISO 3166-1 alpha-2 country code of the country that issued the document.',
    pattern: '^[A-Z]{2}$',
  })
  issuingCountry: string
}

export class CreateRecipientDto {
  @ApiProperty({
    example: 'Alice Johnson',
    description: 'Full name of the recipient.',
  })
  name: string

  @ApiProperty({
    type: IdentityDocumentDto,
    description:
      "Recipient's primary identity document. Used for verification when completing a delivery.",
  })
  identityDocument: IdentityDocumentDto
}
