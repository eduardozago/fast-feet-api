import { AppModule } from '@/app.module'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CourierFactory } from 'test/factories/delivery/make-courier'
import { DeliveryFactory } from 'test/factories/delivery/make-delivery'
import { RecipientFactory } from 'test/factories/delivery/make-recipient'
import { RecipientAddressFactory } from 'test/factories/delivery/make-recipient-address'
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Fetch Deliveries (E2E)', () => {
  let app: NestFastifyApplication
  let accountFactory: AccountFactory
  let courierFactory: CourierFactory
  let recipientFactory: RecipientFactory
  let recipientAddressFactory: RecipientAddressFactory
  let deliveryFactory: DeliveryFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
        CourierFactory,
        RecipientFactory,
        RecipientAddressFactory,
        DeliveryFactory,
      ],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaServiceE2E)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    )

    jwt = moduleRef.get(JwtService)

    accountFactory = moduleRef.get(AccountFactory)
    courierFactory = moduleRef.get(CourierFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    recipientAddressFactory = moduleRef.get(RecipientAddressFactory)
    deliveryFactory = moduleRef.get(DeliveryFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[GET] /deliveries', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'ADMIN',
    })

    const workerAccount = await accountFactory.makePrismaAccount({
      email: 'worker@example.com',
      role: 'WORKER',
    })

    const workerAccount2 = await accountFactory.makePrismaAccount({
      email: 'worker2@example.com',
      role: 'WORKER',
    })

    const courier1 = await courierFactory.makePrismaCourier({
      accountId: workerAccount.id,
    })

    const courier2 = await courierFactory.makePrismaCourier({
      accountId: workerAccount2.id,
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const recipient1 = await recipientFactory.makePrismaRecipient()
    const recipient2 = await recipientFactory.makePrismaRecipient()
    const recipient3 = await recipientFactory.makePrismaRecipient()

    const recipient1Address =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: recipient1.id,
      })

    const recipient2Address =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: recipient2.id,
      })

    const recipient3Address =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: recipient3.id,
      })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier1.id,
      recipientId: recipient1.id,
      recipientAddressId: recipient1Address.id,
      status: DeliveryStatus.CREATED,
    })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier2.id,
      recipientId: recipient2.id,
      recipientAddressId: recipient2Address.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier2.id,
      recipientId: recipient3.id,
      recipientAddressId: recipient3Address.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    const response = await request(app.getHttpServer())
      .get('/deliveries')
      .query({
        page: 1,
        limit: 10,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.deliveries).toHaveLength(3)
  })
})
