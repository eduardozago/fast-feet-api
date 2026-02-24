import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../../pipes/zod-validation-pipe'
import { RegisterCourierUseCase } from '@/domain/delivery/application/use-cases/courier/register-courier'
import { AccountNotFoundError } from '@/domain/delivery/application/use-cases/courier/errors/account-not-found-error'
import { Roles } from '@/infra/auth/roles.decorator'

const registerCourierBodySchema = z.object({
  accountId: z.string(),
  name: z.string(),
})

type RegisterCourierBodySchema = z.infer<typeof registerCourierBodySchema>

@Controller()
@UsePipes(new ZodValidationPipe(registerCourierBodySchema))
export class RegisterCourierController {
  constructor(private registerCourierUseCase: RegisterCourierUseCase) {}

  @Post('/couriers')
  @Roles('ADMIN')
  async handle(@Body() body: RegisterCourierBodySchema) {
    const { accountId, name } = body

    const result = await this.registerCourierUseCase.execute({
      accountId,
      name,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AccountNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
