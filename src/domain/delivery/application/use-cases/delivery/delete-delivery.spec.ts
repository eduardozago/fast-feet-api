import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { DeleteDeliveryUseCase } from './delete-delivery'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: DeleteDeliveryUseCase

describe('Delete Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new DeleteDeliveryUseCase(deliveriesRepository)
  })

  it('should be able to delete delivery', async () => {
    const delivery = makeDelivery()

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items.length).toBe(0)
  })
})
