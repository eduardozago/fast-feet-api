import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { RecipientFactory } from 'test/factories/delivery/make-recipient'
import { RecipientAddressFactory } from 'test/factories/delivery/make-recipient-address'
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Create Delivery (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let recipientFactory: RecipientFactory
  let recipientAddressFactory: RecipientAddressFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, RecipientFactory, RecipientAddressFactory],
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

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[POST] /deliveries', async () => {
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

    const response = await request(app.getHttpServer())
      .post('/deliveries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientId: recipient.id.toString(),
        recipientAddressId: address.id.toString(),
      })

    expect(response.statusCode).toBe(201)

    const deliveryOnDatabase = await prisma.delivery.findFirst({
      where: {
        recipientId: recipient.id.toString(),
        recipientAddressId: address.id.toString(),
      },
    })

    expect(deliveryOnDatabase).toBeDefined()
    expect(deliveryOnDatabase?.recipientId).toBe(recipient.id.toString())
    expect(deliveryOnDatabase?.recipientAddressId).toBe(address.id.toString())
  })
})
