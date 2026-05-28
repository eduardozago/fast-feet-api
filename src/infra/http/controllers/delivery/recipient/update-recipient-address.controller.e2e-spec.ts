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
import { RecipientAddressFactory } from 'test/factories/delivery/make-recipient-address'
import { AccountFactory } from 'test/factories/identity/make-account'
import { FakeGeocodingService } from 'test/location/fake-geocoding-service'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Update Recipient Address (E2E)', () => {
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
    recipientAddressFactory = moduleRef.get(RecipientAddressFactory)

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[PUT] /recipients/:recipientId/addresses/:addressId', async () => {
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
      street: 'Old Street',
      number: '123',
      complement: 'Old Complement',
      neighborhood: 'Old Neighborhood',
      city: 'Old City',
      state: 'Old State',
      country: 'Old Country',
      postalCode: '12345-678',
    })

    const response = await request(app.getHttpServer())
      .put(
        `/recipients/${recipient.id.toString()}/addresses/${address.id.toString()}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        street: 'New Street',
        number: '456',
        neighborhood: 'New Neighborhood',
        complement: 'New Complement',
        city: 'New City',
        state: 'New State',
        country: 'New Country',
        postalCode: '87654-321',
      })

    expect(response.statusCode).toBe(204)

    const recipientOnDatabase = await prisma.recipientAddress.findUnique({
      where: {
        id: address.id.toString(),
      },
    })

    expect(recipientOnDatabase).toBeDefined()
    expect(recipientOnDatabase?.street).toBe('New Street')
    expect(recipientOnDatabase?.number).toBe('456')
    expect(recipientOnDatabase?.neighborhood).toBe('New Neighborhood')
    expect(recipientOnDatabase?.city).toBe('New City')
    expect(recipientOnDatabase?.state).toBe('New State')
    expect(recipientOnDatabase?.postalCode).toBe('87654-321')
  })
})
