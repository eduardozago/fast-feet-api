import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { CreateAccountController } from './controllers/identity/create-account.controller'
import { CreateAccountUseCase } from '@/domain/identity/application/use-cases/create-account'
import { AuthenticateController } from './controllers/identity/authenticate.controller'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { ChangePasswordController } from './controllers/identity/change-password.controller'
import { ChangePasswordUseCase } from '@/domain/identity/application/use-cases/change-password'
import { GatewaysModule } from '../gateways/gateways.module'
import { RegisterCourierController } from './controllers/delivery/courier/register-courier.controller'
import { RegisterCourierUseCase } from '@/domain/delivery/application/use-cases/courier/register-courier'

@Module({
  imports: [DatabaseModule, CryptographyModule, GatewaysModule],
  controllers: [
    // Identity
    CreateAccountController,
    AuthenticateController,
    ChangePasswordController,
    // Delivery
    RegisterCourierController,
  ],
  providers: [
    // Identity
    CreateAccountUseCase,
    AuthenticateUseCase,
    ChangePasswordUseCase,
    // Delivery
    RegisterCourierUseCase,
  ],
})
export class HttpModule {}
