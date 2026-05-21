import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { AssignCourierUseCase } from './assign-courier'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotAssignCourierError } from './errors/cannot-assign-courier-error'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { makeCourier } from 'test/factories/delivery/make-courier'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let sut: AssignCourierUseCase

describe('Assign Courier', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    couriersRepository = new InMemoryCouriersRepository()
    sut = new AssignCourierUseCase(deliveriesRepository, couriersRepository)
  })

  it('should be able to assign courier', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const courier = makeCourier()

    await couriersRepository.create(courier)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      courierId: courier.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0]).toEqual(
      expect.objectContaining({
        status: DeliveryStatus.ASSIGNED,
        courierId: courier.id,
      }),
    )
  })

  it('should not be able to assign courier if delivery does not in created status', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveriesRepository.create(delivery)

    const courier = makeCourier()

    await couriersRepository.create(courier)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      courierId: courier.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(result.value).toBeInstanceOf(CannotAssignCourierError)
  })
})
