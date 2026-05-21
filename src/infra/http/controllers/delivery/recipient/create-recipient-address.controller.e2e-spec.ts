import { AppModule } from '@/app.module'
import { GeocodingService } from '@/domain/delivery/application/location/geocoding-service'
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
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import { AccountFactory } from 'test/factories/identity/make-account'
import { FakeGeocodingService } from 'test/location/fake-geocoding-service'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Create Recipient Address (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let recipientFactory: RecipientFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory, RecipientFactory],
    })
      .overrideProvider(PrismaService)
      .useClass(PrismaServiceE2E)
      .overrideProvider(GeocodingService)
      .useClass(FakeGeocodingService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    )

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)

    accountFactory = moduleRef.get(AccountFactory)
    recipientFactory = moduleRef.get(RecipientFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[POST] /recipients/:recipientId/addresses', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'ADMIN',
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const recipient = await recipientFactory.makePrismaRecipient()

    const address = makeRecipientAddress({
      recipientId: recipient.id,
    })

    const response = await request(app.getHttpServer())
      .post(`/recipients/${recipient.id.toString()}/addresses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
      })

    expect(response.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipientAddress.findFirst({
      where: {
        recipientId: recipient.id.toString(),
      },
    })

    expect(recipientOnDatabase).toBeDefined()
    expect(recipientOnDatabase?.street).toBe(address.street)
    expect(recipientOnDatabase?.number).toBe(address.number)
    expect(recipientOnDatabase?.neighborhood).toBe(address.neighborhood)
    expect(recipientOnDatabase?.city).toBe(address.city)
    expect(recipientOnDatabase?.state).toBe(address.state)
    expect(recipientOnDatabase?.postalCode).toBe(address.postalCode)
  })
})
