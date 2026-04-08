import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { StartTransitUseCase } from './start-transit'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotStartTransitError } from './errors/cannot-start-transit-error'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { CourierNotFoundError } from '../courier/errors/courier-not-found-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let sut: StartTransitUseCase

describe('Start Transit', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    couriersRepository = new InMemoryCouriersRepository()
    sut = new StartTransitUseCase(deliveriesRepository, couriersRepository)
  })

  it('should be able to start transit', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.WAITING_PICKUP,
    })

    await deliveriesRepository.create(delivery)

    const courier = makeCourier()

    await couriersRepository.create(courier)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      courierId: courier.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(deliveriesRepository.items[0].courierId).toEqual(courier.id)
  })

  it('should not be able to start transit if delivery is not waiting for pickup', async () => {
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

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(result.value).toBeInstanceOf(CannotStartTransitError)
  })

  it('should not be able to start transit if courier does not exist', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.WAITING_PICKUP,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      courierId: 'non-existent-courier-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.WAITING_PICKUP,
    )
    expect(result.value).toBeInstanceOf(CourierNotFoundError)
  })
})
