import { AppModule } from '@/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as argon2 from 'argon2'
import request from 'supertest'
import { AccountFactory } from 'test/factories/identity/make-account'
import { PrismaServiceE2E } from 'test/prisma-service-e2e'

describe('Change Password (E2E)', () => {
  let app: INestApplication
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

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)

    accountFactory = moduleRef.get(AccountFactory)

    await app.init()
  })

  test('[POST] /change-password', async () => {
    const account = await accountFactory.makePrismaAccount({
      email: 'johndoe@example.com',
      password: await argon2.hash('12345678'),
    })

    const accessToken = jwt.sign({
      sub: account.id.toString(),
    })

    const response = await request(app.getHttpServer())
      .post('/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'johndoe@example.com',
        password: '12345678',
        newPassword: '87654321',
      })

    expect(response.statusCode).toBe(201)

    const accountOnDatabase = await prisma.account.findUnique({
      where: {
        id: account.id.toString(),
      },
    })

    if (!accountOnDatabase) {
      throw new Error('Account not found')
    }

    const isPasswordUpdated = await argon2.verify(
      accountOnDatabase.password,
      '87654321',
    )

    expect(isPasswordUpdated).toBe(true)
  })
})
