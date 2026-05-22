import { ApiProperty } from '@nestjs/swagger'

export class RegisterCourierDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    description:
      'ID of the WORKER account to be linked to this courier profile. The account must exist and have the WORKER role.',
  })
  accountId: string

  @ApiProperty({
    example: 'John Carter',
    description: 'Full name of the courier.',
  })
  name: string
}
