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
import { DeliveryFactory } from 'test/factories/delivery/make-delivery'
import { RecipientFactory } from 'test/factories/delivery/make-recipient'
import { RecipientAddressFactory } from 'test/factories/delivery/make-recipient-address'
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Delete Delivery (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let recipientFactory: RecipientFactory
  let recipientAddressFactory: RecipientAddressFactory
  let deliveryFactory: DeliveryFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        AccountFactory,
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
    recipientFactory = moduleRef.get(RecipientFactory)
    recipientAddressFactory = moduleRef.get(RecipientAddressFactory)
    deliveryFactory = moduleRef.get(DeliveryFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[DELETE] /deliveries/:id', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'ADMIN',
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const recipient = await recipientFactory.makePrismaRecipient()

    const address = await recipientAddressFactory.makePrismaRecipientAddress({
      recipientId: recipient.id,
    })

    const delivery = await deliveryFactory.makePrismaDelivery({
      recipientId: recipient.id,
      recipientAddressId: address.id,
      status: DeliveryStatus.CREATED,
    })

    const response = await request(app.getHttpServer())
      .delete(`/deliveries/${delivery.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    const deliveryOnDatabase = await prisma.delivery.findUnique({
      where: {
        id: delivery.id.toString(),
      },
    })

    expect(deliveryOnDatabase).toBeNull()
  })
})
