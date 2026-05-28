import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DeliveryDetailsResponse {
  @ApiProperty({
    example: 'e5f6a7b8-c9d0-1234-efgh-345678901234',
    format: 'uuid',
    description: 'Unique delivery identifier.',
  })
  id: string

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  recipientId: string

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    format: 'uuid',
    nullable: true,
    type: String,
    description:
      'ID of the assigned courier. `null` when the delivery has not been assigned yet.',
  })
  courierId: string | null

  @ApiProperty({
    example: 'Alice Johnson',
    description: 'Full name of the recipient.',
  })
  recipientName: string

  @ApiPropertyOptional({
    example: 'John Carter',
    nullable: true,
    type: String,
    description:
      'Full name of the assigned courier. `null` when no courier is assigned.',
  })
  courierName: string | null

  @ApiProperty({
    enum: ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'],
    example: 'ASSIGNED',
    description:
      'Current delivery status. Lifecycle: `CREATED → ASSIGNED → IN_TRANSIT → COMPLETED`.',
  })
  status: string

  @ApiProperty({
    example: '2024-03-15T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date

  @ApiPropertyOptional({
    example: '2024-03-15T14:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: Date,
  })
  updatedAt: Date | null
}
