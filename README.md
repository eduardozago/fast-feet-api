# Fast Feet API

> A portfolio-grade RESTful API for a **delivery management system**, built with clean architecture, Domain-Driven Design (DDD), and geospatial capabilities.

[![Unit Tests](https://github.com/eduardozago/fast-feet-api/actions/workflows/run-unit-tests.yml/badge.svg)](https://github.com/eduardozago/fast-feet-api/actions/workflows/run-unit-tests.yml)
[![E2E Tests](https://github.com/eduardozago/fast-feet-api/actions/workflows/run-e2e-tests.yml/badge.svg)](https://github.com/eduardozago/fast-feet-api/actions/workflows/run-e2e-tests.yml)

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Tests](#tests)
- [Application Rules](#application-rules)
- [Project Structure](#project-structure)

---

## Overview

Fast Feet API manages the full lifecycle of package deliveries — from account creation and courier registration, through recipient address geocoding, to real-time nearby delivery queries based on geolocation. It was designed as a portfolio project to demonstrate production-inspired backend engineering practices.

---

## Tech Stack

| Category         | Technology                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Runtime          | [Node.js](https://nodejs.org/)                                                                    |
| Framework        | [NestJS](https://nestjs.com/) + [Fastify](https://fastify.dev/)                                   |
| Language         | [TypeScript](https://www.typescriptlang.org/)                                                     |
| Database         | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/)                |
| Auth             | [JWT](https://jwt.io/) (RS256) + [Passport.js](https://www.passportjs.org/)                       |
| Password Hashing | [Argon2](https://github.com/ranisalt/node-argon2)                                                 |
| Validation       | [Zod](https://zod.dev/) + [zod-validation-error](https://github.com/causaly/zod-validation-error) |
| Geocoding        | [Nominatim / OpenStreetMap](https://nominatim.org/) via `@nestjs/axios`                           |
| Testing          | [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest)                   |
| Containerization | [Docker](https://www.docker.com/) + Docker Compose                                                |
| CI               | GitHub Actions                                                                                    |

---

## Features

- **Account management** — register accounts with `ADMIN` or `WORKER` (courier) roles, authenticate with JWT, and change password
- **Courier management** — register couriers linked to worker accounts, with role validation
- **Recipient management** — create recipients with identity documents (CPF, passport, etc.) and manage multiple addresses
- **Address geocoding** — recipient addresses are automatically geocoded on creation and update via the Nominatim API, storing `latitude` and `longitude`
- **Delivery lifecycle** — strict status flow: `CREATED → ASSIGNED → IN_TRANSIT → COMPLETED`, with clear admin/courier ownership at each transition
- **Proof of delivery** — couriers complete deliveries by submitting receiver evidence, optional GPS coordinates, and a proof image URL reference
- **Nearby deliveries** — couriers query their own pending deliveries within a configurable radius (km) using the **Haversine formula** and paginated results
- **Role-based access control** — global `JwtAuthGuard` + `RolesGuard`; admins manage the platform, couriers act only on their own deliveries
- **CI pipelines** — unit tests and E2E tests run automatically on every pull request via GitHub Actions

---

## Architecture

The project follows **Clean Architecture** and **Domain-Driven Design (DDD)**, keeping business logic completely decoupled from frameworks and infrastructure.

```
src/
├── core/               # Shared primitives: Either, Entity, ValueObject, UniqueEntityID
├── domain/
│   ├── identity/       # Account bounded context (entities, use cases, repository interfaces)
│   └── delivery/       # Delivery bounded context (courier, recipient, delivery entities, use cases)
└── infra/
    ├── auth/           # JwtAuthGuard, RolesGuard, JwtStrategy (RS256)
    ├── cryptography/   # Argon2 hash generator/checker, JWT encrypter
    ├── database/       # Prisma service, mappers, repository implementations
    ├── env/            # EnvService — type-safe env vars via Zod schema
    ├── gateways/       # IdentityGateway — cross-domain account lookup
    ├── http/           # NestJS controllers, ZodValidationPipe, presenters
    └── location/       # NominatimGeocodingService — address → coordinates
```

### Key Architectural Layers

- **`src/domain/`** is completely framework-agnostic. Entities, use cases, and repository interfaces have zero NestJS or Prisma imports.
- **`src/infra/`** wires the domain to the outside world — HTTP, database, external APIs. Infra can be swapped without touching domain logic.
- **Repository pattern** — use cases depend on abstract repository interfaces. Concrete Prisma implementations are injected by NestJS's DI container.
- **Either monad** — use cases return `Either<Error, Value>` instead of throwing exceptions, making error paths explicit and type-safe.

---

## Technical Decisions & Trade-offs

### Fastify over Express

NestJS defaults to Express. Fastify was chosen for its significantly lower overhead and better throughput for I/O-bound delivery workloads. The trade-off is a slightly different request lifecycle (e.g. Fastify's `reply` vs Express's `res`), which required adapting E2E tests and middleware setup.

### RS256 asymmetric JWT

Symmetric HS256 requires sharing the secret with every service that validates tokens. RS256 lets the API sign with a private key while any downstream service (e.g. a future mobile app backend) can verify tokens using only the public key — a safer design for a distributed system.

### Argon2id for password hashing

Argon2id was selected over bcrypt/scrypt because it is the winner of the Password Hashing Competition and is resistant to both GPU brute-force and side-channel attacks. The cost parameters (memory cost, time cost) are explicitly configured rather than left at defaults.

### Haversine formula in the application layer

The nearby deliveries feature (`GET /couriers/me/deliveries/nearby`) calculates distances using the Haversine formula in a custom `Coordinate` value object rather than relying on a PostGIS extension or database-level geospatial functions. **Trade-off**: the current approach filters deliveries with a latitude/longitude bounding box first, then applies exact distance validation in the repository. This is pragmatic for moderate data volumes. For a production system at scale, migrating the `recipient_addresses` table to PostGIS and using `ST_DWithin` would be the right move.

### Nominatim geocoding (free, no API key)

The geocoding service is abstracted behind a `GeocodingService` interface in the domain layer. The Nominatim/OpenStreetMap implementation lives in `src/infra/location/`. Swapping to Google Maps or Mapbox requires only a new infra class — no domain changes. **Trade-off**: Nominatim has strict rate limits (1 req/sec) and lower accuracy in some regions compared to paid providers. Acceptable for a portfolio project; a paid service would be the production choice.

### Zod for runtime validation at the HTTP boundary

Zod schemas are defined in each controller and piped through a custom `ZodValidationPipe`. This keeps validation co-located with the route handler, provides descriptive error messages via `zod-validation-error`, and avoids the overhead of class-transformer/class-validator decorators throughout the codebase.

### Isolated E2E test schemas

Each E2E test run creates a unique PostgreSQL schema (`test_<uuid>`) via the `PrismaServiceE2E` adapter and `db push`. This enables fully parallel test execution without test data collisions and cleans up automatically after each suite.

### Delivery read models for list endpoints

Delivery listing endpoints return application read models instead of raw domain entities. This keeps write-side domain entities focused on business rules while allowing list responses to include frontend-friendly fields such as recipient and courier names. HTTP presenters still own the final response shape.

### `accountId` vs `courierId` in courier use cases

Courier-specific delivery use cases accept an `accountId` (from the JWT payload) rather than a `courierId`. This is intentional: the HTTP layer should expose as little internal domain data as possible. The use case resolves the courier by its linked account ID internally, keeping the API surface clean.

### Delivery lifecycle ownership

The delivery lifecycle was modeled to reflect a realistic operational flow while keeping the API simple:

```txt
CREATED
  ↓ admin assigns courier
ASSIGNED
  ↓ assigned courier picks up package
IN_TRANSIT
  ↓ assigned courier submits proof of delivery
COMPLETED
```

### Proof of delivery without full file management

Delivery completion is handled by a single courier endpoint that submits proof and completes the delivery in the same operation. This avoids inconsistent states such as a completed delivery without proof, or an orphan proof for a delivery still in transit.

The proof model intentionally accepts flexible evidence:

- `receivedByName` identifies who received the package.
- `receivedByDocument` can be provided when available.
- `recipientRelationship` supports real cases where a doorman, receptionist, neighbor, or family member receives the package.
- `proofImageUrl` references an externally stored image, instead of making this API responsible for file upload/storage.
- `latitude` and `longitude` are optional because couriers may complete deliveries in places with poor connectivity or unreliable GPS.
- `notes` are required when the receiver is not the original recipient.

**Trade-off:** this project stores a `proofImageUrl` instead of implementing a complete upload pipeline. A production system could later add direct-to-storage uploads, signed URLs, file validation, retention policies, and CDN integration. For this portfolio API, keeping storage external keeps the delivery domain focused on business rules.

### Relaxed proof validation

The API does not block completion only because the receiver document differs from the recipient record or because GPS is unavailable/out of range. Instead, it records validation signals:

- `documentMatchesRecipient` shows whether the submitted document matches the recipient document.
- `locationValidationStatus` classifies GPS evidence as `WITHIN_RANGE`, `OUT_OF_RANGE`, or `UNAVAILABLE`.
- `distanceFromDestinationInKm` stores the computed distance when coordinates are provided.

This is a pragmatic real-world approach: the system captures audit evidence without preventing valid deliveries in edge cases such as remote areas, offline operation, building reception desks, or authorized third-party receivers.

### Atomic delivery completion

Creating the proof of delivery and updating the delivery status are persisted in one transaction through a delivery completion persistence abstraction. The current abstraction is intentionally application-specific because completion changes two persisted models (`ProofOfDelivery` and `Delivery`) and must succeed or fail as one unit.

---

## API Endpoints

### Identity

| Method  | Path                 | Auth   | Role | Description                |
| ------- | -------------------- | ------ | ---- | -------------------------- |
| `POST`  | `/accounts`          | Public | —    | Create an account          |
| `POST`  | `/sessions`          | Public | —    | Authenticate (returns JWT) |
| `PATCH` | `/accounts/password` | JWT    | Any  | Change own password        |

### Couriers

| Method | Path        | Auth | Role  | Description        |
| ------ | ----------- | ---- | ----- | ------------------ |
| `POST` | `/couriers` | JWT  | ADMIN | Register a courier |

### Recipients

| Method   | Path                                     | Auth | Role  | Description                     |
| -------- | ---------------------------------------- | ---- | ----- | ------------------------------- |
| `POST`   | `/recipients`                            | JWT  | ADMIN | Create a recipient              |
| `POST`   | `/recipients/:recipientId/addresses`     | JWT  | ADMIN | Add an address (geocoded)       |
| `GET`    | `/recipients/:recipientId/addresses`     | JWT  | ADMIN | List recipient addresses        |
| `PUT`    | `/recipients/:recipientId/addresses/:id` | JWT  | ADMIN | Update an address (re-geocoded) |
| `DELETE` | `/recipients/:recipientId/addresses/:id` | JWT  | ADMIN | Delete an address               |

### Deliveries

| Method   | Path                                           | Auth | Role   | Description                                        |
| -------- | ---------------------------------------------- | ---- | ------ | -------------------------------------------------- |
| `POST`   | `/deliveries`                                  | JWT  | ADMIN  | Create a delivery                                  |
| `GET`    | `/deliveries`                                  | JWT  | ADMIN  | List deliveries with recipient/courier details     |
| `PATCH`  | `/deliveries/:deliveryId/assign-courier`       | JWT  | ADMIN  | Assign a courier and transition to ASSIGNED        |
| `DELETE` | `/deliveries/:id`                              | JWT  | ADMIN  | Delete a delivery (only if CREATED)                |
| `GET`    | `/couriers/me/deliveries`                      | JWT  | WORKER | List authenticated courier deliveries              |
| `GET`    | `/couriers/me/deliveries/nearby`               | JWT  | WORKER | List own nearby deliveries by coordinates + radius |
| `PATCH`  | `/couriers/me/deliveries/:deliveryId/pick-up`  | JWT  | WORKER | Assigned courier picks up a delivery               |
| `PATCH`  | `/couriers/me/deliveries/:deliveryId/complete` | JWT  | WORKER | Assigned courier completes a delivery with proof   |

#### `GET /deliveries` Query Parameters

| Param    | Type      | Required | Description                              |
| -------- | --------- | -------- | ---------------------------------------- |
| `status` | `string`  | ❌       | Filter by delivery status                |
| `page`   | `integer` | ❌       | Page number (default: 1)                 |
| `limit`  | `integer` | ❌       | Results per page (default: 20, max: 100) |

#### `GET /couriers/me/deliveries` Query Parameters

| Param    | Type      | Required | Description                              |
| -------- | --------- | -------- | ---------------------------------------- |
| `status` | `string`  | ❌       | Filter by delivery status                |
| `page`   | `integer` | ❌       | Page number (default: 1)                 |
| `limit`  | `integer` | ❌       | Results per page (default: 20, max: 100) |

#### `GET /couriers/me/deliveries/nearby` Query Parameters

| Param        | Type      | Required | Description                               |
| ------------ | --------- | -------- | ----------------------------------------- |
| `latitude`   | `number`  | ✅       | Courier's current latitude (-90 to 90)    |
| `longitude`  | `number`  | ✅       | Courier's current longitude (-180 to 180) |
| `radiusInKm` | `number`  | ✅       | Search radius in km (max 100)             |
| `page`       | `integer` | ❌       | Page number (default: 1)                  |
| `limit`      | `integer` | ❌       | Results per page (default: 20, max: 100)  |

#### `PATCH /couriers/me/deliveries/:deliveryId/complete` Body

| Field                   | Type     | Required | Description                                                                     |
| ----------------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `receivedByName`        | `string` | ✅       | Name of the person who received the package                                     |
| `receivedByDocument`    | `string` | ❌       | Receiver document; required when no `proofImageUrl` is sent                     |
| `recipientRelationship` | `string` | ✅       | `RECIPIENT`, `FAMILY_MEMBER`, `DOORMAN`, `RECEPTIONIST`, `NEIGHBOR`, or `OTHER` |
| `proofType`             | `string` | ✅       | `DOCUMENT`, `PHOTO`, `SIGNATURE`, or `MANUAL`                                   |
| `proofImageUrl`         | `string` | ❌       | URL for an externally stored proof image; required when no document is sent     |
| `latitude`              | `number` | ❌       | Courier latitude at completion time                                             |
| `longitude`             | `number` | ❌       | Courier longitude at completion time                                            |
| `notes`                 | `string` | ❌       | Required when the receiver is not the original recipient                        |

At least one evidence field must be present: `receivedByDocument` or `proofImageUrl`.

---

## Getting Started

**Requirements:** Node.js 22+, pnpm, Docker and Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/eduardozago/fast-feet-api.git
cd fast-feet-api

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in:
#   JWT_PRIVATE_KEY  — base64-encoded RS256 private key
#   JWT_PUBLIC_KEY   — base64-encoded RS256 public key
#   NOMINATIM_API_URL and NOMINATIM_API_USER_AGENT (optional, defaults provided)

# 4. Start the database
docker compose up -d

# 5. Generate Prisma client and run migrations
pnpm prisma generate
pnpm prisma migrate deploy

# 6. Start the development server
pnpm start:dev
# Server will be available at http://localhost:3333
```

### Generating RS256 keys

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key
openssl rsa -pubout -in private.pem -out public.pem

# Encode to base64 (single line)
base64 -w 0 private.pem   # → JWT_PRIVATE_KEY
base64 -w 0 public.pem    # → JWT_PUBLIC_KEY
```

---

## Tests

The project has two test suites managed by Vitest:

```bash
# Unit tests (domain use cases, entities, value objects)
pnpm test

# E2E tests (full HTTP request/response cycle against a real database)
pnpm test:e2e

# Coverage report
pnpm test:cov
```

### Test Strategy

- **Unit tests** — colocated `*.spec.ts` files under `src/domain/`. Use in-memory repository fakes, fake cryptography implementations, and a `FakeGeocodingService`. Zero NestJS or Prisma dependencies.
- **E2E tests** — `*.e2e-spec.ts` files under `src/infra/http/controllers/`. Each suite spins up the full NestJS application with Fastify, overrides `PrismaService` with `PrismaServiceE2E` (isolated schema per run), and sends real HTTP requests via Supertest.

---

## Application Rules

### Functional Requirements

- [x] Register and authenticate accounts (ADMIN / WORKER roles)
- [x] Change account password
- [x] Register couriers linked to worker accounts
- [x] Create, update, and delete recipients and their addresses (with geocoding)
- [x] Create, list, filter, and delete deliveries
- [x] Transition delivery status: CREATED → ASSIGNED → IN_TRANSIT → COMPLETED
- [x] Complete deliveries with proof of delivery evidence
- [x] Couriers query their nearby deliveries by coordinates and radius

### Business Rules

- [x] Only admins can register couriers, manage recipients, create deliveries, assign couriers, and delete deliveries
- [x] Only the assigned courier can pick up and complete a delivery
- [x] A delivery can only be deleted when its status is `CREATED`
- [x] A delivery must be linked to a recipient and a valid recipient address
- [x] Recipient addresses are geocoded automatically on creation and update
- [x] Delivery status transitions follow a strict order and cannot be skipped
- [x] The nearby deliveries endpoint only returns deliveries assigned to the authenticated courier
- [x] Completing a delivery creates proof of delivery and updates status atomically
- [x] Proof of delivery records document matching and location validation signals without blocking real-world edge cases

### Non-functional Requirements

- [x] Passwords hashed with Argon2id
- [x] Authentication via RS256 asymmetric JWT
- [x] Data persisted in PostgreSQL via Prisma ORM with typed mappers
- [x] Containerized database with Docker Compose
- [x] Unit and E2E tests with Vitest + isolated test schemas
- [x] CI pipelines (unit + E2E) on every pull request via GitHub Actions
- [x] Input validation at the HTTP boundary using Zod schemas

---

## Project Structure

```
fast-feet-api/
├── .github/
│   └── workflows/          # CI: run-unit-tests.yml, run-e2e-tests.yml
├── prisma/
│   ├── schema.prisma        # Database schema (Account, Courier, Recipient, Delivery)
│   └── migrations/          # Versioned SQL migrations
├── src/
│   ├── core/                # Either monad, Entity, ValueObject, UniqueEntityID
│   ├── domain/
│   │   ├── identity/        # Account entity, use cases, repository interface
│   │   └── delivery/        # Courier, Recipient, RecipientAddress, Delivery entities
│   │       ├── application/ # Use cases, repository interfaces, GeocodingService abstraction
│   │       └── enterprise/  # Entities and value objects (Coordinate with Haversine)
│   └── infra/
│       ├── auth/            # JWT strategy, guards, roles decorator
│       ├── cryptography/    # Argon2, JWT encrypter
│       ├── database/        # PrismaService, Prisma mappers, repository implementations
│       ├── env/             # Zod-validated environment variables
│       ├── gateways/        # IdentityGateway (cross-domain account lookup)
│       ├── http/            # Controllers, ZodValidationPipe, presenters
│       └── location/        # NominatimGeocodingService
└── test/
    ├── cryptography/        # FakeHashGenerator, FakeHashChecker, FakeEncrypter
    ├── factories/           # Test data factories (Prisma + in-memory)
    ├── gateways/            # FakeIdentityGateway
    ├── location/            # FakeGeocodingService
    └── repositories/        # In-memory repository implementations
```
