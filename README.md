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
- **Delivery lifecycle** — strict status flow: `CREATED → WAITING_PICKUP → IN_TRANSIT → COMPLETED`, with validation at every transition
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

The nearby deliveries feature (`GET /deliveries/nearby`) calculates distances using the Haversine formula in a custom `Coordinate` value object rather than relying on a PostGIS extension or database-level geospatial functions. **Trade-off**: the current approach fetches the courier's deliveries and filters by distance in the Prisma query using a bounding-box pre-filter (latitude/longitude range), avoiding a full table scan. This is pragmatic for moderate data volumes. For a production system at scale, migrating the `recipient_addresses` table to PostGIS and using `ST_DWithin` would be the right move.

### Nominatim geocoding (free, no API key)

The geocoding service is abstracted behind a `GeocodingService` interface in the domain layer. The Nominatim/OpenStreetMap implementation lives in `src/infra/location/`. Swapping to Google Maps or Mapbox requires only a new infra class — no domain changes. **Trade-off**: Nominatim has strict rate limits (1 req/sec) and lower accuracy in some regions compared to paid providers. Acceptable for a portfolio project; a paid service would be the production choice.

### Zod for runtime validation at the HTTP boundary

Zod schemas are defined in each controller and piped through a custom `ZodValidationPipe`. This keeps validation co-located with the route handler, provides descriptive error messages via `zod-validation-error`, and avoids the overhead of class-transformer/class-validator decorators throughout the codebase.

### Isolated E2E test schemas

Each E2E test run creates a unique PostgreSQL schema (`test_<uuid>`) via the `PrismaServiceE2E` adapter and `db push`. This enables fully parallel test execution without test data collisions and cleans up automatically after each suite.

### `accountId` vs `courierId` in use cases

The `FetchNearbyDeliveriesUseCase` accepts an `accountId` (from the JWT payload) rather than a `courierId`. This is intentional: the HTTP layer should expose as little internal domain data as possible. The use case resolves the courier by its linked account ID internally, keeping the API surface clean.

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

| Method   | Path                              | Auth | Role   | Description                                        |
| -------- | --------------------------------- | ---- | ------ | -------------------------------------------------- |
| `POST`   | `/deliveries`                     | JWT  | ADMIN  | Create a delivery                                  |
| `PATCH`  | `/deliveries/:id/wait-for-pickup` | JWT  | ADMIN  | Transition to WAITING_PICKUP                       |
| `PATCH`  | `/deliveries/:id/start-transit`   | JWT  | ADMIN  | Transition to IN_TRANSIT (assigns courier)         |
| `PATCH`  | `/deliveries/:id/complete`        | JWT  | ADMIN  | Transition to COMPLETED                            |
| `DELETE` | `/deliveries/:id`                 | JWT  | ADMIN  | Delete a delivery (only if CREATED)                |
| `GET`    | `/deliveries/nearby`              | JWT  | WORKER | List own nearby deliveries by coordinates + radius |

#### `GET /deliveries/nearby` Query Parameters

| Param        | Type      | Required | Description                               |
| ------------ | --------- | -------- | ----------------------------------------- |
| `latitude`   | `number`  | ✅       | Courier's current latitude (-90 to 90)    |
| `longitude`  | `number`  | ✅       | Courier's current longitude (-180 to 180) |
| `radiusInKm` | `number`  | ✅       | Search radius in km (max 100)             |
| `page`       | `integer` | ❌       | Page number (default: 1)                  |
| `limit`      | `integer` | ❌       | Results per page (default: 20, max: 100)  |

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
- [x] Create, list, and delete deliveries
- [x] Transition delivery status: WAITING_PICKUP → IN_TRANSIT → COMPLETED
- [x] Couriers query their nearby deliveries by coordinates and radius

### Business Rules

- [x] Only admins can register couriers, manage recipients, and manage deliveries
- [x] Only the assigned courier can start transit and complete a delivery
- [x] A delivery can only be deleted when its status is `CREATED`
- [x] A delivery must be linked to a recipient and a valid recipient address
- [x] Recipient addresses are geocoded automatically on creation and update
- [x] Delivery status transitions follow a strict order and cannot be skipped
- [x] The nearby deliveries endpoint only returns deliveries assigned to the authenticated courier

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
