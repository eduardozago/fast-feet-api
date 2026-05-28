import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { InvalidCredentialsError } from '@/domain/identity/application/use-cases/errors/invalid-credentials-error'
import { ChangePasswordUseCase } from '@/domain/identity/application/use-cases/change-password'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ChangePasswordDto } from '../../swagger/dtos/identity/change-password.dto'

const changePasswordBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  newPassword: z
    .string()
    .min(8, 'New password must have at least 8 characters'),
})

type ChangePasswordBodySchema = z.infer<typeof changePasswordBodySchema>

@ApiTags('Identity')
@ApiBearerAuth('JWT')
@Controller()
@UsePipes(new ZodValidationPipe(changePasswordBodySchema))
export class ChangePasswordController {
  constructor(private changePasswordUseCase: ChangePasswordUseCase) {}

  @Post('/change-password')
  @ApiOperation({
    summary: 'Change password',
    description:
      'Update the password for the authenticated account. Both the JWT token and the current password are required as a double-verification measure for this sensitive operation.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiCreatedResponse({ description: 'Password changed successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation error.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token, or incorrect current password.',
  })
  async handle(@Body() body: ChangePasswordBodySchema) {
    const { email, password, newPassword } = body

    const result = await this.changePasswordUseCase.execute({
      email,
      password,
      newPassword,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case InvalidCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
