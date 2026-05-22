import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RecipientAddressResponse {
  @ApiProperty({
    example: 'd4e5f6a7-b8c9-0123-defg-234567890123',
    format: 'uuid',
  })
  id: string

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  recipientId: string

  @ApiProperty({ example: 'Baker Street' })
  street: string

  @ApiProperty({ example: '123' })
  number: string

  @ApiProperty({ example: 'Midtown' })
  neighborhood: string

  @ApiPropertyOptional({ example: 'Apt 4B', nullable: true, type: String })
  complement: string | null

  @ApiProperty({ example: 'New York' })
  city: string

  @ApiProperty({ example: 'NY' })
  state: string

  @ApiProperty({ example: 'United States' })
  country: string

  @ApiProperty({ example: '10001' })
  postalCode: string
}
