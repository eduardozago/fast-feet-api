import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { CreateAccountController } from './controllers/identity/create-account.controller'
import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AuthenticateController } from './controllers/identity/authenticate.controller'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [CreateAccountController, AuthenticateController],
  providers: [CreateAccountUseCase, AuthenticateUseCase],
})
export class HttpModule {}
