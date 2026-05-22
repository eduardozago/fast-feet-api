import { ApiProperty } from '@nestjs/swagger'

export class AssignCourierDto {
  @ApiProperty({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    format: 'uuid',
    description:
      'ID of the courier to assign. The delivery status will be transitioned from `CREATED` to `ASSIGNED`.',
  })
  courierId: string
}
