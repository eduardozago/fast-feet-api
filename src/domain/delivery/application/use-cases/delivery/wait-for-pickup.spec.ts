import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { WaitForPickupUseCase } from './wait-for-pickup'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotWaitForPickupError } from './errors/cannot-wait-for-pickup-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: WaitForPickupUseCase

describe('Wait for Pickup', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new WaitForPickupUseCase(deliveriesRepository)
  })

  it('should be able to wait for pickup', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.WAITING_PICKUP,
    )
  })

  it('should not be able to wait for pickup if delivery does not in created status', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(result.value).toBeInstanceOf(CannotWaitForPickupError)
  })
})
