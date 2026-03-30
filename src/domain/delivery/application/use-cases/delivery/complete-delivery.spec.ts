import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotCompleteDeliveryError } from './errors/cannot-complete-delivery-error'
import { CompleteDeliveryUseCase } from './complete-delivery'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: CompleteDeliveryUseCase

describe('Complete Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new CompleteDeliveryUseCase(deliveriesRepository)
  })

  it('should be able to complete delivery', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.COMPLETED,
    )
  })

  it('should not be able to complete delivery if delivery is not in transit', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(result.value).toBeInstanceOf(CannotCompleteDeliveryError)
  })
})
