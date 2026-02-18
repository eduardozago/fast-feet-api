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

const changePasswordBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  newPassword: z
    .string()
    .min(8, 'New password must have at least 8 characters'),
})

type ChangePasswordBodySchema = z.infer<typeof changePasswordBodySchema>

@Controller()
@UsePipes(new ZodValidationPipe(changePasswordBodySchema))
export class ChangePasswordController {
  constructor(private changePasswordUseCase: ChangePasswordUseCase) {}

  @Post('/change-password')
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
