import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AccountAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/account-already-exists-error'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { Roles } from '@/infra/auth/roles.decorator'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CreateAccountDto } from '../../swagger/dtos/identity/create-account.dto'

const createAccountBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  role: z.enum(['ADMIN', 'WORKER']).default('WORKER'),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@ApiTags('Identity')
@ApiBearerAuth()
@Controller()
@Roles('ADMIN')
@UsePipes(new ZodValidationPipe(createAccountBodySchema))
export class CreateAccountController {
  constructor(private createAccountUseCase: CreateAccountUseCase) {}

  @Post('/accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an account',
    description:
      'Register a new account with either an `ADMIN` or `WORKER` role. ' +
      'Requires an authenticated `ADMIN`. The role defaults to `WORKER` if omitted. ' +
      'To provision the very first admin without an existing account, set ' +
      '`BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the environment — ' +
      'the application will create that account automatically on startup.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiCreatedResponse({ description: 'Account created successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid request body or validation error.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Caller does not have the ADMIN role.' })
  @ApiConflictResponse({
    description: 'An account with this email address already exists.',
  })
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
