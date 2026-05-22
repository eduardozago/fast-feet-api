import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CourierDeliveryDetailsResponse {
  @ApiProperty({
    example: 'e5f6a7b8-c9d0-1234-efgh-345678901234',
    format: 'uuid',
  })
  id: string

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  recipientId: string

  @ApiProperty({ example: 'Alice Johnson' })
  recipientName: string

  @ApiProperty({
    enum: ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'],
    example: 'IN_TRANSIT',
    description:
      'Current delivery status. Lifecycle: `CREATED → ASSIGNED → IN_TRANSIT → COMPLETED`.',
  })
  status: string

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z', format: 'date-time' })
  createdAt: Date

  @ApiPropertyOptional({
    example: '2024-03-15T14:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: Date,
  })
  updatedAt: Date | null
}
