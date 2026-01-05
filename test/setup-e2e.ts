import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { execSync } from 'node:child_process'

import { randomUUID } from 'node:crypto'

let prisma: PrismaClient
const schemaId = randomUUID()

function generateUniqueDatabaseURL(schemaId: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }

  const url = new URL(process.env.DATABASE_URL)

  url.searchParams.set('schema', schemaId)

  return url.toString()
}

beforeAll(() => {
  const databaseUrl = generateUniqueDatabaseURL(schemaId)

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  })

  prisma = new PrismaClient({ adapter })

  execSync('pnpm prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
