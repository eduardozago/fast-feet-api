import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RecipientAddressDto {
  @ApiProperty({
    example: 'Baker Street',
    description: 'Street name.',
  })
  street: string

  @ApiProperty({
    example: '123',
    description: 'Building or house number.',
  })
  number: string

  @ApiProperty({
    example: 'Midtown',
    description: 'Neighborhood or district.',
  })
  neighborhood: string

  @ApiPropertyOptional({
    example: 'Apt 4B',
    description:
      'Additional address detail such as apartment, suite, or floor number.',
  })
  complement?: string

  @ApiProperty({
    example: 'New York',
    description: 'City.',
  })
  city: string

  @ApiProperty({
    example: 'NY',
    description: 'State or province abbreviation.',
  })
  state: string

  @ApiProperty({
    example: 'United States',
    description: 'Country name.',
  })
  country: string

  @ApiProperty({
    example: '10001',
    description:
      'Postal or ZIP code. Used together with the other address fields for geocoding.',
  })
  postalCode: string
}
