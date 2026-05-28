import { Module } from '@nestjs/common'
import { IdentityGateway } from '@/domain/delivery/application/gateways/identity-gateway'
import { IdentityGateway as IdentityGatewayImplementation } from './identity-gateway'
import { DatabaseModule } from '@/infra/database/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: IdentityGateway,
      useClass: IdentityGatewayImplementation,
    },
  ],
  exports: [IdentityGateway],
})
export class GatewaysModule {}
