import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { PickUpDeliveryUseCase } from './pick-up-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotPickUpDeliveryError } from './errors/cannot-pick-up-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: PickUpDeliveryUseCase

describe('Pick Up Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new PickUpDeliveryUseCase(deliveriesRepository)
  })

  it('should be able to pick up delivery', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.ASSIGNED,
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

  it('should not be able to pick up delivery if delivery is not assigned', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(result.value).toBeInstanceOf(CannotPickUpDeliveryError)
  })
})
