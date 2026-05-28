import { ApiProperty } from '@nestjs/swagger'

export class AuthenticateDto {
  @ApiProperty({
    example: 'admin@fastfeet.com',
    description: 'Email address of the account.',
  })
  email: string

  @ApiProperty({
    example: 'securepass123',
    description: 'Account password.',
  })
  password: string
}
