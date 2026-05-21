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
import { CreateDeliveryController } from './controllers/delivery/delivery/create-delivery.controller'
import { CreateDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/create-delivery'
import { AssignCourierController } from './controllers/delivery/delivery/assign-courier.controller'
import { AssignCourierUseCase } from '@/domain/delivery/application/use-cases/delivery/assign-courier'
import { PickUpDeliveryController } from './controllers/delivery/courier/pickup-delivery.controller'
import { PickUpDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/pick-up-delivery'
import { CompleteDeliveryController } from './controllers/delivery/courier/complete-delivery.controller'
import { CompleteDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/complete-delivery'
import { DeleteDeliveryController } from './controllers/delivery/delivery/delete-delivery.controller'
import { DeleteDeliveryUseCase } from '@/domain/delivery/application/use-cases/delivery/delete-delivery'
import { LocationModule } from '../location/location.module'
import { FetchCourierDeliveriesController } from './controllers/delivery/courier/fetch-courier-deliveries.controller'
import { FetchCourierDeliveriesUseCase } from '@/domain/delivery/application/use-cases/courier/fetch-courier-deliveries'
import { FetchNearbyCourierDeliveriesController } from './controllers/delivery/courier/fetch-nearby-courier-deliveries.controller'
import { FetchNearbyCourierDeliveriesUseCase } from '@/domain/delivery/application/use-cases/courier/fetch-nearby-courier-deliveries'
import { FetchDeliveriesController } from './controllers/delivery/delivery/fetch-deliveries.controller'
import { FetchDeliveriesUseCase } from '@/domain/delivery/application/use-cases/delivery/fetch-deliveries'

@Module({
  imports: [DatabaseModule, CryptographyModule, GatewaysModule, LocationModule],
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
    CreateDeliveryController,
    AssignCourierController,
    PickUpDeliveryController,
    CompleteDeliveryController,
    DeleteDeliveryController,
    FetchCourierDeliveriesController,
    FetchNearbyCourierDeliveriesController,
    FetchDeliveriesController,
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
    CreateDeliveryUseCase,
    AssignCourierUseCase,
    PickUpDeliveryUseCase,
    CompleteDeliveryUseCase,
    DeleteDeliveryUseCase,
    FetchCourierDeliveriesUseCase,
    FetchNearbyCourierDeliveriesUseCase,
    FetchDeliveriesUseCase,
  ],
})
export class HttpModule {}
