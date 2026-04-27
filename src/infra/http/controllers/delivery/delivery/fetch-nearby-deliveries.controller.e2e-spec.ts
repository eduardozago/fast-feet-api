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

describe('Fetch Nearby Deliveries (E2E)', () => {
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

  test('[GET] /deliveries/nearby', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'WORKER',
    })

    const courier = await courierFactory.makePrismaCourier({
      accountId: account.id,
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const nearbyRecipient1 = await recipientFactory.makePrismaRecipient()
    const nearbyRecipient2 = await recipientFactory.makePrismaRecipient()
    const distantRecipient = await recipientFactory.makePrismaRecipient()
    const anotherCourierRecipient = await recipientFactory.makePrismaRecipient()

    const nearbyAddress1 =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: nearbyRecipient1.id,
        latitude: 51.502564,
        longitude: -0.1149108,
      })

    const nearbyAddress2 =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: nearbyRecipient2.id,
        latitude: 51.4583803,
        longitude: -0.059257,
      })

    const distantAddress =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: distantRecipient.id,
        latitude: 51.4977334,
        longitude: 0.2157321,
      })

    const anotherCourierNearbyAddress =
      await recipientAddressFactory.makePrismaRecipientAddress({
        recipientId: anotherCourierRecipient.id,
        latitude: 51.501476,
        longitude: -0.1280048,
      })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier.id,
      recipientId: nearbyRecipient1.id,
      recipientAddressId: nearbyAddress1.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier.id,
      recipientId: nearbyRecipient2.id,
      recipientAddressId: nearbyAddress2.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveryFactory.makePrismaDelivery({
      courierId: courier.id,
      recipientId: distantRecipient.id,
      recipientAddressId: distantAddress.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    const anotherAccount = await accountFactory.makePrismaAccount({
      role: 'WORKER',
    })
    const anotherCourier = await courierFactory.makePrismaCourier({
      accountId: anotherAccount.id,
    })

    await deliveryFactory.makePrismaDelivery({
      courierId: anotherCourier.id,
      recipientId: anotherCourierRecipient.id,
      recipientAddressId: anotherCourierNearbyAddress.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    const response = await request(app.getHttpServer())
      .get(
        '/deliveries/nearby?latitude=51.501476&longitude=-0.1280048&radiusInKm=10&page=1&limit=10',
      )
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.deliveries).toHaveLength(2)
  })
})
