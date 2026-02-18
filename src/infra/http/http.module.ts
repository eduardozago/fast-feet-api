import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { CreateAccountController } from './controllers/identity/create-account.controller'
import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AuthenticateController } from './controllers/identity/authenticate.controller'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { ChangePasswordController } from './controllers/identity/change-password.controller'
import { ChangePasswordUseCase } from '@/domain/identity/application/use-cases/change-password'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    ChangePasswordController,
  ],
  providers: [CreateAccountUseCase, AuthenticateUseCase, ChangePasswordUseCase],
})
export class HttpModule {}
