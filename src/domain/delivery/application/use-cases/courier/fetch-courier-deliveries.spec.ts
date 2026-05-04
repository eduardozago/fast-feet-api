import { FetchCourierDeliveriesUseCase } from './fetch-courier-deliveries'
import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchCourierDeliveriesUseCase

describe('Fetch Courier Deliveries', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    deliveriesRepository = new InMemoryDeliveriesRepository(
      undefined,
      recipientsRepository,
    )
    couriersRepository = new InMemoryCouriersRepository()
    sut = new FetchCourierDeliveriesUseCase(
      deliveriesRepository,
      couriersRepository,
    )
  })

  it('should be able to fetch courier deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    const recipient1 = makeRecipient()
    await recipientsRepository.create(recipient1)

    const recipient2 = makeRecipient()
    await recipientsRepository.create(recipient2)

    const recipient3 = makeRecipient()
    await recipientsRepository.create(recipient3)

    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient1.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient2.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient3.id,
        status: DeliveryStatus.COMPLETED,
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
    expect(result.value.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient1.name,
        }),
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient2.name,
        }),
        expect.objectContaining({
          status: DeliveryStatus.COMPLETED,
          recipientName: recipient3.name,
        }),
      ]),
    )
  })

  it('should be able to fetch courier deliveries filtered by status', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    const recipient1 = makeRecipient()
    await recipientsRepository.create(recipient1)

    const recipient2 = makeRecipient()
    await recipientsRepository.create(recipient2)

    const recipient3 = makeRecipient()
    await recipientsRepository.create(recipient3)

    const recipient4 = makeRecipient()
    await recipientsRepository.create(recipient4)

    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient1.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient2.id,
        status: DeliveryStatus.IN_TRANSIT,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient3.id,
        status: DeliveryStatus.COMPLETED,
      }),
    )
    await deliveriesRepository.create(
      makeDelivery({
        courierId: courier.id,
        recipientId: recipient4.id,
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

    expect(result.value.deliveries).toHaveLength(3)
    expect(result.value.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient1.name,
        }),
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient2.name,
        }),
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient4.name,
        }),
      ]),
    )
  })

  it('should be able to fetch paginated deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    for (let i = 0; i < 12; i++) {
      const recipient = makeRecipient()
      await recipientsRepository.create(recipient)
      await deliveriesRepository.create(
        makeDelivery({ courierId: courier.id, recipientId: recipient.id }),
      )
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
