import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { DeleteDeliveryUseCase } from './delete-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotDeleteDeliveryError } from './errors/cannot-delete-delivery-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let sut: DeleteDeliveryUseCase

describe('Delete Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new DeleteDeliveryUseCase(deliveriesRepository)
  })

  it('should be able to delete delivery', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items.length).toBe(0)
  })

  it('should be not able to delete delivery with status other than CREATED', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CannotDeleteDeliveryError)
  })
})
