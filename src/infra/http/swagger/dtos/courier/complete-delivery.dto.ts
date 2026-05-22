import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CompleteDeliveryDto {
  @ApiProperty({
    example: 'Jane Smith',
    description: 'Full name of the person who physically received the package.',
  })
  receivedByName: string

  @ApiPropertyOptional({
    example: 'AB-123456',
    description:
      'Document number of the receiver. At least one of `receivedByDocument` or `proofImageUrl` must be provided.',
  })
  receivedByDocument?: string

  @ApiProperty({
    enum: [
      'RECIPIENT',
      'FAMILY_MEMBER',
      'DOORMAN',
      'RECEPTIONIST',
      'NEIGHBOR',
      'OTHER',
    ],
    example: 'RECIPIENT',
    description:
      'Relationship of the receiver to the original recipient. When the value is not `RECIPIENT`, the `notes` field becomes required.',
  })
  recipientRelationship:
    | 'RECIPIENT'
    | 'FAMILY_MEMBER'
    | 'DOORMAN'
    | 'RECEPTIONIST'
    | 'NEIGHBOR'
    | 'OTHER'

  @ApiProperty({
    enum: ['DOCUMENT', 'PHOTO', 'SIGNATURE', 'MANUAL'],
    example: 'PHOTO',
    description: 'Type of evidence used to confirm delivery.',
  })
  proofType: 'DOCUMENT' | 'PHOTO' | 'SIGNATURE' | 'MANUAL'

  @ApiPropertyOptional({
    example: 'https://cdn.fastfeet.com/proofs/delivery-abc123.jpg',
    format: 'uri',
    description:
      'URL of an externally stored proof image. At least one of `proofImageUrl` or `receivedByDocument` must be provided.',
  })
  proofImageUrl?: string

  @ApiPropertyOptional({
    example: 40.7128,
    description:
      "Courier's latitude at the time of delivery. Optional — system records `UNAVAILABLE` location status when omitted.",
    minimum: -90,
    maximum: 90,
  })
  latitude?: number

  @ApiPropertyOptional({
    example: -74.006,
    description:
      "Courier's longitude at the time of delivery. Optional — system records `UNAVAILABLE` location status when omitted.",
    minimum: -180,
    maximum: 180,
  })
  longitude?: number

  @ApiPropertyOptional({
    example: 'Package left with building doorman on the ground floor.',
    description:
      'Required when `recipientRelationship` is not `RECIPIENT`. Provides context about the delivery handoff.',
  })
  notes?: string
}
