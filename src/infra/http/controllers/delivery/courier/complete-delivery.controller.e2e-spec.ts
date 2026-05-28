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
import { makeIdentityDocument } from 'test/factories/delivery/make-identity-type'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Complete Delivery (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
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

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)

    accountFactory = moduleRef.get(AccountFactory)
    courierFactory = moduleRef.get(CourierFactory)
    recipientFactory = moduleRef.get(RecipientFactory)
    recipientAddressFactory = moduleRef.get(RecipientAddressFactory)
    deliveryFactory = moduleRef.get(DeliveryFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[PATCH] /couriers/me/deliveries/:deliveryId/complete', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'WORKER',
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const courier = await courierFactory.makePrismaCourier({
      accountId: account.id,
    })

    const recipient = await recipientFactory.makePrismaRecipient({
      identityDocument: makeIdentityDocument({ number: '12345678900' }),
    })

    const address = await recipientAddressFactory.makePrismaRecipientAddress({
      recipientId: recipient.id,
    })

    const delivery = await deliveryFactory.makePrismaDelivery({
      recipientId: recipient.id,
      recipientAddressId: address.id,
      status: DeliveryStatus.IN_TRANSIT,
      courierId: courier.id,
    })

    const response = await request(app.getHttpServer())
      .patch(`/couriers/me/deliveries/${delivery.id.toString()}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        receivedByName: recipient.name,
        receivedByDocument: '12345678900',
        recipientRelationship: 'RECIPIENT',
        proofType: 'DOCUMENT',
      })

    expect(response.statusCode).toBe(204)

    const deliveryOnDatabase = await prisma.delivery.findUnique({
      where: {
        id: delivery.id.toString(),
      },
    })

    expect(deliveryOnDatabase).toBeDefined()
    expect(deliveryOnDatabase?.status).toBe('COMPLETED')

    const proofOfDeliveryOnDatabase = await prisma.proofOfDelivery.findUnique({
      where: {
        deliveryId: delivery.id.toString(),
      },
    })

    expect(proofOfDeliveryOnDatabase).toBeDefined()
    expect(proofOfDeliveryOnDatabase?.courierId).toBe(courier.id.toString())
    expect(proofOfDeliveryOnDatabase?.receivedByName).toBe(recipient.name)
    expect(proofOfDeliveryOnDatabase?.receivedByDocument).toBe('12345678900')
    expect(proofOfDeliveryOnDatabase?.recipientRelationship).toBe('RECIPIENT')
    expect(proofOfDeliveryOnDatabase?.proofType).toBe('DOCUMENT')
    expect(proofOfDeliveryOnDatabase?.documentMatchesRecipient).toBe(true)
  })
})
