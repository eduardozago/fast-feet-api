import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AccountAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/account-already-exists-error'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { Public } from '@/infra/auth/public'

const createAccountBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  role: z.enum(['ADMIN', 'WORKER']).default('WORKER'),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller()
@Public()
@UsePipes(new ZodValidationPipe(createAccountBodySchema))
export class CreateAccountController {
  constructor(private createAccountUseCase: CreateAccountUseCase) {}

  @Post('/accounts')
  async handle(@Body() body: CreateAccountBodySchema) {
    const { email, password, role } = body

    const result = await this.createAccountUseCase.execute({
      email,
      password,
      role,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AccountAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
