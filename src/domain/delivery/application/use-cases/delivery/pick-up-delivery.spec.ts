import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { PickUpDeliveryUseCase } from './pick-up-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotPickUpDeliveryError } from './errors/cannot-pick-up-error'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { InvalidCourierAssignedError } from './errors/invalid-courier-assigned-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let sut: PickUpDeliveryUseCase

describe('Pick Up Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    couriersRepository = new InMemoryCouriersRepository()
    sut = new PickUpDeliveryUseCase(deliveriesRepository, couriersRepository)
  })

  it('should be able to pick up delivery', async () => {
    const courier = makeCourier()

    const delivery = makeDelivery({
      status: DeliveryStatus.ASSIGNED,
      courierId: courier.id,
    })

    await couriersRepository.create(courier)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
  })

  it('should not be able to pick up delivery if delivery is not assigned', async () => {
    const courier = makeCourier()

    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await couriersRepository.create(courier)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(result.value).toBeInstanceOf(CannotPickUpDeliveryError)
  })

  it('should not be able to pick up delivery with wrong courier', async () => {
    const courier = makeCourier()

    const delivery = makeDelivery({
      status: DeliveryStatus.ASSIGNED,
      courierId: courier.id,
    })

    await couriersRepository.create(courier)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: 'different-account-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.ASSIGNED,
    )
    expect(result.value).toBeInstanceOf(InvalidCourierAssignedError)
  })
})
