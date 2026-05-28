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
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Create Recipient (E2E)', () => {
  let app: NestFastifyApplication
  let prisma: PrismaService
  let accountFactory: AccountFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AccountFactory],
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

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  test('[POST] /recipients', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      role: 'ADMIN',
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
      role: account.role,
    })

    const response = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'John Doe',
        identityDocument: {
          type: 'PERSONAL_ID',
          number: '12345678901',
          issuingCountry: 'BR',
        },
      })

    expect(response.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: {
        identityDocumentNumber: '12345678901',
      },
    })

    expect(recipientOnDatabase).toBeDefined()
    expect(recipientOnDatabase?.name).toBe('John Doe')
    expect(recipientOnDatabase?.identityDocumentType).toBe('PERSONAL_ID')
    expect(recipientOnDatabase?.identityDocumentNumber).toBe('12345678901')
    expect(recipientOnDatabase?.identityIssuingCountry).toBe('BR')
  })
})
