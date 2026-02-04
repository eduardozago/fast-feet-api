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
import { Public } from '@/infra/auth/public'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { InvalidCredentialsError } from '@/domain/identity/application/use-cases/errors/invalid-credentials-error'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller()
@Public()
@UsePipes(new ZodValidationPipe(authenticateBodySchema))
export class AuthenticateController {
  constructor(private authenticateUseCase: AuthenticateUseCase) {}

  @Post('/sessions')
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body

    const result = await this.authenticateUseCase.execute({
      email,
      password,
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

    const { accessToken } = result.value

    return {
      access_token: accessToken,
    }
  }
}
