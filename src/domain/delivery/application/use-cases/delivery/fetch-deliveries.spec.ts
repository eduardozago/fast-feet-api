import { FetchDeliveriesUseCase } from './fetch-deliveries'
import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'
import { makeCourier } from 'test/factories/delivery/make-courier'

let deliveriesRepository: InMemoryDeliveriesRepository
let recipientsRepository: InMemoryRecipientsRepository
let couriersRepository: InMemoryCouriersRepository
let sut: FetchDeliveriesUseCase

describe('Fetch Deliveries', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    couriersRepository = new InMemoryCouriersRepository()
    deliveriesRepository = new InMemoryDeliveriesRepository(
      undefined,
      recipientsRepository,
      couriersRepository,
    )

    sut = new FetchDeliveriesUseCase(deliveriesRepository)
  })

  it('should be able to fetch deliveries', async () => {
    const recipient1 = makeRecipient()
    await recipientsRepository.create(recipient1)
    const recipient2 = makeRecipient()
    await recipientsRepository.create(recipient2)

    const courier1 = makeCourier()
    await couriersRepository.create(courier1)

    await deliveriesRepository.create(
      makeDelivery({ recipientId: recipient1.id, courierId: courier1.id }),
    )
    await deliveriesRepository.create(
      makeDelivery({ recipientId: recipient1.id }),
    )

    const result = await sut.execute({
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    expect(result.value!.deliveries).toHaveLength(2)
  })

  it('should be able to fetch deliveries by status', async () => {
    const recipient1 = makeRecipient()
    await recipientsRepository.create(recipient1)
    const recipient2 = makeRecipient()
    await recipientsRepository.create(recipient2)
    const recipient3 = makeRecipient()
    await recipientsRepository.create(recipient3)
    const recipient4 = makeRecipient()
    await recipientsRepository.create(recipient4)

    const courier1 = makeCourier()
    await couriersRepository.create(courier1)
    const courier2 = makeCourier()
    await couriersRepository.create(courier2)
    const courier3 = makeCourier()
    await couriersRepository.create(courier3)

    await deliveriesRepository.create(
      makeDelivery({
        status: DeliveryStatus.CREATED,
        recipientId: recipient1.id,
      }),
    )

    await deliveriesRepository.create(
      makeDelivery({
        status: DeliveryStatus.IN_TRANSIT,
        recipientId: recipient2.id,
        courierId: courier1.id,
      }),
    )

    await deliveriesRepository.create(
      makeDelivery({
        status: DeliveryStatus.IN_TRANSIT,
        recipientId: recipient3.id,
        courierId: courier2.id,
      }),
    )

    await deliveriesRepository.create(
      makeDelivery({
        status: DeliveryStatus.COMPLETED,
        recipientId: recipient4.id,
        courierId: courier3.id,
      }),
    )

    const result = await sut.execute({
      status: DeliveryStatus.IN_TRANSIT,
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    expect(result.value!.deliveries).toHaveLength(2)
  })

  it('should be able to fetch paginated deliveries', async () => {
    for (let i = 0; i < 12; i++) {
      const recipient = makeRecipient()
      await recipientsRepository.create(recipient)

      await deliveriesRepository.create(
        makeDelivery({
          recipientId: recipient.id,
        }),
      )
    }

    const result = await sut.execute({
      page: 2,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    expect(result.value!.deliveries).toHaveLength(2)
  })
})
