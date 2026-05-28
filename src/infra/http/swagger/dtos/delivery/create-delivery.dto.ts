import { ApiProperty } from '@nestjs/swagger'

export class CreateDeliveryDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    description: 'ID of the recipient for this delivery.',
  })
  recipientId: string

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    format: 'uuid',
    description:
      'ID of the specific recipient address to deliver to. Must belong to the specified recipient.',
  })
  recipientAddressId: string
}
