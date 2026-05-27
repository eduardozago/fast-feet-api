/**
 * Database seed — creates a consistent set of demo records covering all
 * delivery lifecycle states (CREATED → ASSIGNED → IN_TRANSIT → COMPLETED).
 *
 * Usage:  pnpm db:seed
 *
 * The seed is idempotent. On every run, existing seed records are updated and
 * passwords are reset to the values printed in the summary at the end.
 */

import 'dotenv/config'

import * as argon2 from 'argon2'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

// Domain entities
import {
  Account,
  AccountRole,
} from '../src/domain/identity/enterprise/entities/account'
import { Courier } from '../src/domain/delivery/enterprise/entities/courier'
import { Recipient } from '../src/domain/delivery/enterprise/entities/recipient'
import {
  IdentityDocument,
  IdentificationType,
} from '../src/domain/delivery/enterprise/entities/value-objects/identity-document'
import { RecipientAddress } from '../src/domain/delivery/enterprise/entities/recipient-address'
import { Delivery } from '../src/domain/delivery/enterprise/entities/delivery'
import {
  ProofOfDelivery,
  RecipientRelationship,
  ProofType,
  LocationValidationStatus,
} from '../src/domain/delivery/enterprise/entities/proof-of-delivery'
import { UniqueEntityID } from '../src/core/entities/unique-entity-id'

// Prisma mappers
import { PrismaAccountMapper } from '../src/infra/database/prisma/mappers/identity/prisma-account-mapper'
import { PrismaCourierMapper } from '../src/infra/database/prisma/mappers/delivery/prisma-courier-mapper'
import { PrismaRecipientMapper } from '../src/infra/database/prisma/mappers/delivery/prisma-recipient-mapper'
import { PrismaRecipientAddressMapper } from '../src/infra/database/prisma/mappers/delivery/prisma-recipient-address-mapper'
import { PrismaDeliveryMapper } from '../src/infra/database/prisma/mappers/delivery/prisma-delivery-mapper'
import { PrismaProofOfDeliveryMapper } from '../src/infra/database/prisma/mappers/delivery/prisma-proof-of-delivery-mapper'

// ─── Fixed seed IDs — stable across runs, enabling idempotent upserts ─────────

const ID = {
  adminAccount: '00000000-0000-0000-0001-000000000001',
  workerAccount: '00000000-0000-0000-0001-000000000002',
  courier: '00000000-0000-0000-0002-000000000001',
  recipient1: '00000000-0000-0000-0003-000000000001',
  recipient2: '00000000-0000-0000-0003-000000000002',
  address1: '00000000-0000-0000-0004-000000000001',
  address2: '00000000-0000-0000-0004-000000000002',
  deliveryCreated: '00000000-0000-0000-0005-000000000001',
  deliveryAssigned: '00000000-0000-0000-0005-000000000002',
  deliveryInTransit: '00000000-0000-0000-0005-000000000003',
  deliveryCompleted: '00000000-0000-0000-0005-000000000004',
  proof: '00000000-0000-0000-0006-000000000001',
} as const

// ─── Demo credentials ─────────────────────────────────────────────────────────

const DEMO = {
  admin: { email: 'admin@fastfeet.com', password: 'Admin@2024' },
  courier: { email: 'courier@fastfeet.com', password: 'Courier@2024' },
} as const

// ─── Argon2 options — must match Argon2HashGenerator in the application ───────

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 47104,
  timeCost: 3,
  parallelism: 2,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips the `id` field from a mapper output so it can be passed to the
 * `update` branch of an upsert (Prisma does not allow updating primary keys).
 */
function withoutId<T extends { id?: unknown }>(data: T): Omit<T, 'id'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, ...rest } = data
  return rest
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not defined. Copy .env.example to .env and fill in the values.',
    )
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('🌱  Seeding database…\n')

    // ── 1. Passwords ───────────────────────────────────────────────────────────

    const [adminHash, workerHash] = await Promise.all([
      argon2.hash(DEMO.admin.password, ARGON2_OPTIONS),
      argon2.hash(DEMO.courier.password, ARGON2_OPTIONS),
    ])

    // ── 2. Accounts ────────────────────────────────────────────────────────────

    const adminAccount = Account.create(
      {
        email: DEMO.admin.email,
        password: adminHash,
        role: AccountRole.ADMIN,
      },
      new UniqueEntityID(ID.adminAccount),
    )

    const workerAccount = Account.create(
      {
        email: DEMO.courier.email,
        password: workerHash,
        role: AccountRole.WORKER,
      },
      new UniqueEntityID(ID.workerAccount),
    )

    for (const account of [adminAccount, workerAccount]) {
      const data = PrismaAccountMapper.toPrisma(account)
      await prisma.account.upsert({
        where: { id: account.id.toString() },
        create: data,
        update: withoutId(data),
      })
    }

    console.log(
      `  ✓  Accounts     ${DEMO.admin.email} (ADMIN), ${DEMO.courier.email} (WORKER)`,
    )

    // ── 3. Courier ─────────────────────────────────────────────────────────────

    const courier = Courier.create(
      {
        accountId: new UniqueEntityID(ID.workerAccount),
        name: 'James Walker',
      },
      new UniqueEntityID(ID.courier),
    )

    const courierData = PrismaCourierMapper.toPrisma(courier)
    await prisma.courier.upsert({
      where: { id: ID.courier },
      create: courierData,
      update: withoutId(courierData),
    })

    console.log(`  ✓  Courier      James Walker`)

    // ── 4. Recipients ──────────────────────────────────────────────────────────

    /**
     * aliceJohnson has two pending deliveries (CREATED and ASSIGNED) going to
     * 5th Avenue. robertCarter has two active deliveries (IN_TRANSIT and
     * COMPLETED) going to Park Avenue.
     */

    const aliceJohnson = Recipient.create(
      {
        name: 'Alice Johnson',
        identityDocument: IdentityDocument.create({
          type: IdentificationType.PERSONAL_ID,
          number: 'P123456789',
          issuingCountry: 'US',
        }),
      },
      new UniqueEntityID(ID.recipient1),
    )

    const robertCarter = Recipient.create(
      {
        name: 'Robert Carter',
        identityDocument: IdentityDocument.create({
          type: IdentificationType.PERSONAL_ID,
          number: 'P987654321',
          issuingCountry: 'US',
        }),
      },
      new UniqueEntityID(ID.recipient2),
    )

    for (const recipient of [aliceJohnson, robertCarter]) {
      const data = PrismaRecipientMapper.toPrisma(recipient)
      await prisma.recipient.upsert({
        where: { id: recipient.id.toString() },
        create: data,
        update: withoutId(data),
      })
    }

    console.log(`  ✓  Recipients   Alice Johnson, Robert Carter`)

    // ── 5. Recipient addresses (real New York City coordinates) ────────────────

    /**
     * 350 5th Avenue — Midtown, New York, NY (Empire State Building area)
     * Coordinates verified via Nominatim / OpenStreetMap.
     */
    const fifthAvenue = RecipientAddress.create(
      {
        recipientId: new UniqueEntityID(ID.recipient1),
        street: '5th Avenue',
        number: '350',
        neighborhood: 'Midtown',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        postalCode: '10118',
        latitude: 40.7484,
        longitude: -73.9856,
      },
      new UniqueEntityID(ID.address1),
    )

    /**
     * 200 Park Avenue — Midtown, New York, NY (Grand Central area)
     */
    const parkAvenue = RecipientAddress.create(
      {
        recipientId: new UniqueEntityID(ID.recipient2),
        street: 'Park Avenue',
        number: '200',
        neighborhood: 'Midtown',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        postalCode: '10166',
        latitude: 40.7527,
        longitude: -73.9772,
      },
      new UniqueEntityID(ID.address2),
    )

    for (const address of [fifthAvenue, parkAvenue]) {
      const data = PrismaRecipientAddressMapper.toPrisma(address)
      await prisma.recipientAddress.upsert({
        where: { id: address.id.toString() },
        create: data,
        update: withoutId(data),
      })
    }

    console.log(
      `  ✓  Addresses    350 5th Ave, New York (NY), 200 Park Ave, New York (NY)`,
    )

    // ── 6. Deliveries ──────────────────────────────────────────────────────────

    /**
     * CREATED — created by admin, no courier assigned yet.
     */
    const deliveryCreated = Delivery.create(
      {
        recipientId: new UniqueEntityID(ID.recipient1),
        recipientAddressId: new UniqueEntityID(ID.address1),
      },
      new UniqueEntityID(ID.deliveryCreated),
    )

    /**
     * ASSIGNED — courier assigned by admin, package not yet picked up.
     * Uses domain entity method to replicate the real state transition,
     * which also sets `courierId`, `status`, and `updatedAt`.
     */
    const deliveryAssigned = Delivery.create(
      {
        recipientId: new UniqueEntityID(ID.recipient1),
        recipientAddressId: new UniqueEntityID(ID.address1),
      },
      new UniqueEntityID(ID.deliveryAssigned),
    )
    deliveryAssigned.assignCourier(new UniqueEntityID(ID.courier))

    /**
     * IN_TRANSIT — courier picked up the package.
     */
    const deliveryInTransit = Delivery.create(
      {
        recipientId: new UniqueEntityID(ID.recipient2),
        recipientAddressId: new UniqueEntityID(ID.address2),
      },
      new UniqueEntityID(ID.deliveryInTransit),
    )
    deliveryInTransit.assignCourier(new UniqueEntityID(ID.courier))
    deliveryInTransit.pickUp()

    /**
     * COMPLETED — delivered with proof of delivery attached below.
     */
    const deliveryCompleted = Delivery.create(
      {
        recipientId: new UniqueEntityID(ID.recipient2),
        recipientAddressId: new UniqueEntityID(ID.address2),
      },
      new UniqueEntityID(ID.deliveryCompleted),
    )
    deliveryCompleted.assignCourier(new UniqueEntityID(ID.courier))
    deliveryCompleted.pickUp()
    deliveryCompleted.complete()

    for (const delivery of [
      deliveryCreated,
      deliveryAssigned,
      deliveryInTransit,
      deliveryCompleted,
    ]) {
      const data = PrismaDeliveryMapper.toPrisma(delivery)
      await prisma.delivery.upsert({
        where: { id: delivery.id.toString() },
        create: data,
        update: withoutId(data),
      })
    }

    console.log(`  ✓  Deliveries   CREATED, ASSIGNED, IN_TRANSIT, COMPLETED`)

    // ── 7. Proof of delivery (COMPLETED delivery) ──────────────────────────────

    /**
     * The receiver is Robert Carter himself. His document matches the recipient
     * record (`documentMatchesRecipient: true`). GPS coordinates place the
     * courier at ~20 m from 200 Park Avenue — inside the 300 m validation range.
     */
    const proof = ProofOfDelivery.create(
      {
        deliveryId: new UniqueEntityID(ID.deliveryCompleted),
        courierId: new UniqueEntityID(ID.courier),
        receivedByName: 'Robert Carter',
        receivedByDocument: 'P987654321',
        recipientRelationship: RecipientRelationship.RECIPIENT,
        proofType: ProofType.DOCUMENT,
        latitude: 40.7527,
        longitude: -73.977,
        distanceFromDestinationInKm: 0.02,
        locationValidationStatus: LocationValidationStatus.WITHIN_RANGE,
        documentMatchesRecipient: true,
        notes: null,
      },
      new UniqueEntityID(ID.proof),
    )

    const proofData = PrismaProofOfDeliveryMapper.toPrisma(proof)
    await prisma.proofOfDelivery.upsert({
      where: { deliveryId: ID.deliveryCompleted },
      create: proofData,
      update: withoutId(proofData),
    })

    console.log(
      `  ✓  Proof         DOCUMENT · WITHIN_RANGE · documentMatchesRecipient: true`,
    )

    // ── Summary ────────────────────────────────────────────────────────────────

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   Fast Feet — Demo Data                      ║
╠══════════════════════════════════════════════════════════════╣
║  CREDENTIALS                                                 ║
║  Admin    admin@fastfeet.com    /  Admin@2024                ║
║  Courier  courier@fastfeet.com  /  Courier@2024              ║
╠══════════════════════════════════════════════════════════════╣
║  DELIVERIES                                                  ║
║  CREATED     Alice Johnson  →  350 5th Ave, New York, NY     ║
║  ASSIGNED    Alice Johnson  →  350 5th Ave, New York, NY     ║
║  IN_TRANSIT  Robert Carter  →  200 Park Ave, New York, NY    ║
║  COMPLETED   Robert Carter  →  200 Park Ave, New York, NY    ║
╠══════════════════════════════════════════════════════════════╣
║  API DOCS  http://localhost:3333/reference                   ║
╚══════════════════════════════════════════════════════════════╝
`)
  } finally {
    await prisma.$disconnect()
  }
}

seed().catch((err) => {
  const code: string | undefined = (err as { code?: string }).code

  if (code === 'P2002') {
    console.error(
      '\n❌  Unique constraint violation — the database may already contain',
      'conflicting records not created by this seed.\n',
      '   Run `pnpm prisma migrate reset` to start from a clean state.\n',
    )
  } else {
    console.error('\n❌  Seed failed:', err)
  }

  process.exit(1)
})
