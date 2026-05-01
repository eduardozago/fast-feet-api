import { FetchCourierDeliveriesUseCase } from './fetch-courier-deliveries'
import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let sut: FetchCourierDeliveriesUseCase

describe('Fetch Courier Deliveries', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    couriersRepository = new InMemoryCouriersRepository()
    sut = new FetchCourierDeliveriesUseCase(
      deliveriesRepository,
      couriersRepository,
    )
  })

  it('should be able to fetch courier deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.COMPLETED,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: new UniqueEntityID('other-courier-id'),
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )

    const result = await sut.execute({
      accountId: courier.accountId.toString(),
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected right result')
    }

    expect(result.value.deliveries).toHaveLength(3)
  })

  it('should be able to fetch courier deliveries filtered by status', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        status: DeliveryStatus.COMPLETED,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: new UniqueEntityID('other-courier-id'),
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )

    const result = await sut.execute({
      accountId: courier.accountId.toString(),
      status: DeliveryStatus.IN_TRANSIT,
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected right result')
    }

    expect(result.value.deliveries).toHaveLength(2)
  })

  it('should be able to fetch paginated deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    for (let i = 0; i < 12; i++) {
      await deliveriesRepository.create(makeDelivery({ courierId: courier.id }))
    }

    const result = await sut.execute({
      accountId: courier.accountId.toString(),
      page: 2,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected right result')
    }

    expect(result.value.deliveries).toHaveLength(2)
  })
})
