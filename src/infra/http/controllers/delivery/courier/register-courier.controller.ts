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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { RegisterCourierDto } from '../../../swagger/dtos/courier/register-courier.dto'

const registerCourierBodySchema = z.object({
  accountId: z.string(),
  name: z.string(),
})

type RegisterCourierBodySchema = z.infer<typeof registerCourierBodySchema>

@ApiTags('Couriers')
@ApiBearerAuth('JWT')
@Controller()
@UsePipes(new ZodValidationPipe(registerCourierBodySchema))
export class RegisterCourierController {
  constructor(private registerCourierUseCase: RegisterCourierUseCase) {}

  @Post('/couriers')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Register a courier',
    description:
      'Link a WORKER account to a new courier profile. The `accountId` must reference an existing account with the `WORKER` role. Requires `ADMIN` role.',
  })
  @ApiBody({ type: RegisterCourierDto })
  @ApiCreatedResponse({ description: 'Courier registered successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation error.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role.' })
  @ApiNotFoundResponse({
    description: 'No account found with the provided accountId.',
  })
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
