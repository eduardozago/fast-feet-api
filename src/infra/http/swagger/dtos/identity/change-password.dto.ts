import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty({
    example: 'courier@fastfeet.com',
    description: 'Email address of the account whose password will be changed.',
  })
  email: string

  @ApiProperty({
    example: 'currentpass123',
    description: 'Current account password, required for verification.',
  })
  password: string

  @ApiProperty({
    example: 'newsecurepass456',
    description: 'New password. Minimum 8 characters.',
    minLength: 8,
  })
  newPassword: string
}
