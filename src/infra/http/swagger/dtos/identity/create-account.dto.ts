import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAccountDto {
  @ApiProperty({
    example: 'courier@fastfeet.com',
    description: 'A valid email address — must be unique across all accounts.',
  })
  email: string

  @ApiProperty({
    example: 'securepass123',
    description: 'Account password. Minimum 8 characters.',
    minLength: 8,
  })
  password: string

  @ApiPropertyOptional({
    enum: ['ADMIN', 'WORKER'],
    default: 'WORKER',
    description:
      'Account role. `ADMIN` can manage the platform; `WORKER` is the courier role. Defaults to `WORKER`.',
  })
  role?: 'ADMIN' | 'WORKER'
}
