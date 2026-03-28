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
import { CreateRecipientUseCase } from '@/domain/delivery/application/use-cases/recipient/create-recipient'
import { CreateRecipientController } from './controllers/delivery/recipient/create-recipient.controller'
import { CreateRecipientAddressController } from './controllers/delivery/recipient/create-recipient-address.controller'
import { CreateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/create-recipient-address'
import { FetchRecipientAddressesController } from './controllers/delivery/recipient/fetch-recipient-addresses.controller'
import { FetchRecipientAddressesUseCase } from '@/domain/delivery/application/use-cases/recipient/fetch-recipient-addresses'
import { UpdateRecipientAddressController } from './controllers/delivery/recipient/update-recipient-address.controller'
import { UpdateRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/update-recipient-address'
import { DeleteRecipientAddressController } from './controllers/delivery/recipient/delete-recipient-address.controller'
import { DeleteRecipientAddressUseCase } from '@/domain/delivery/application/use-cases/recipient/delete-recipient-address'

@Module({
  imports: [DatabaseModule, CryptographyModule, GatewaysModule],
  controllers: [
    // Identity
    CreateAccountController,
    AuthenticateController,
    ChangePasswordController,
    // Delivery
    RegisterCourierController,
    CreateRecipientController,
    CreateRecipientAddressController,
    FetchRecipientAddressesController,
    UpdateRecipientAddressController,
    DeleteRecipientAddressController,
  ],
  providers: [
    // Identity
    CreateAccountUseCase,
    AuthenticateUseCase,
    ChangePasswordUseCase,
    // Delivery
    RegisterCourierUseCase,
    CreateRecipientUseCase,
    CreateRecipientAddressUseCase,
    FetchRecipientAddressesUseCase,
    UpdateRecipientAddressUseCase,
    DeleteRecipientAddressUseCase,
  ],
})
export class HttpModule {}
