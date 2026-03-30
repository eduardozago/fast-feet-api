import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { StartTransitUseCase } from './start-transit'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotStartTransitError } from './errors/cannot-start-transit-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: StartTransitUseCase

describe('Start Transit', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new StartTransitUseCase(deliveriesRepository)
  })

  it('should be able to start transit', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.WAITING_PICKUP,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
  })

  it('should not be able to start transit if delivery is not waiting for pickup', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(result.value).toBeInstanceOf(CannotStartTransitError)
  })
})
