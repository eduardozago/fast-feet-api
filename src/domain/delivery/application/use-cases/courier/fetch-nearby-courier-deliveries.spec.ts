import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { FetchNearbyCourierDeliveriesUseCase } from './fetch-nearby-courier-deliveries'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: FetchNearbyCourierDeliveriesUseCase

describe('Fetch Nearby Courier Deliveries', () => {
  beforeEach(() => {
    couriersRepository = new InMemoryCouriersRepository()
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    recipientsRepository = new InMemoryRecipientsRepository()
    deliveriesRepository = new InMemoryDeliveriesRepository(
      recipientAddressesRepository,
      recipientsRepository,
    )

    sut = new FetchNearbyCourierDeliveriesUseCase(
      deliveriesRepository,
      couriersRepository,
    )
  })

  it('should be able to fetch nearby courier deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    const recipient1 = makeRecipient()
    await recipientsRepository.create(recipient1)

    const nearbyAddress1 = makeRecipientAddress({
      recipientId: recipient1.id,
      latitude: 51.502564,
      longitude: -0.1149108,
    })

    const recipient2 = makeRecipient()
    await recipientsRepository.create(recipient2)

    const nearbyAddress2 = makeRecipientAddress({
      recipientId: recipient2.id,
      latitude: 51.4583803,
      longitude: -0.059257,
    })

    const recipient3 = makeRecipient()
    await recipientsRepository.create(recipient3)

    const distantAddress = makeRecipientAddress({
      recipientId: recipient3.id,
      latitude: 51.4977334,
      longitude: 0.2157321,
    })

    await recipientAddressesRepository.create(nearbyAddress1)
    await recipientAddressesRepository.create(nearbyAddress2)
    await recipientAddressesRepository.create(distantAddress)

    const delivery1 = makeDelivery({
      courierId: courier.id,
      recipientId: recipient1.id,
      recipientAddressId: nearbyAddress1.id,
      status: DeliveryStatus.IN_TRANSIT,
    })
    const delivery2 = makeDelivery({
      courierId: courier.id,
      recipientId: recipient2.id,
      recipientAddressId: nearbyAddress2.id,
      status: DeliveryStatus.IN_TRANSIT,
    })
    const delivery3 = makeDelivery({
      courierId: courier.id,
      recipientId: recipient3.id,
      recipientAddressId: distantAddress.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await deliveriesRepository.create(delivery1)
    await deliveriesRepository.create(delivery2)
    await deliveriesRepository.create(delivery3)

    const latitude = 51.501476
    const longitude = -0.1280048

    const result = await sut.execute({
      accountId: courier.accountId.toString(),
      latitude,
      longitude,
      radiusInKm: 10,
      page: 1,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected right result')
    }

    expect(result.value.deliveries).toHaveLength(2)
    expect(result.value.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient1.name,
        }),
        expect.objectContaining({
          status: DeliveryStatus.IN_TRANSIT,
          recipientName: recipient2.name,
        }),
      ]),
    )
  })

  it('should be able to fetch paginated nearby deliveries', async () => {
    const courier = makeCourier()
    await couriersRepository.create(courier)

    const courierCoordinate = Coordinate.create({
      latitude: 51.501476,
      longitude: -0.1280048,
    })

    for (let i = 0; i < 12; i++) {
      const recipient = makeRecipient()
      await recipientsRepository.create(recipient)

      const address = makeRecipientAddress({
        recipientId: recipient.id,
        latitude: courierCoordinate.latitude + i * 0.001,
        longitude: courierCoordinate.longitude + i * 0.001,
      })

      await recipientAddressesRepository.create(address)

      await deliveriesRepository.create(
        makeDelivery({
          courierId: courier.id,
          recipientId: recipient.id,
          recipientAddressId: address.id,
          status: DeliveryStatus.IN_TRANSIT,
        }),
      )
    }

    const result = await sut.execute({
      accountId: courier.accountId.toString(),
      latitude: courierCoordinate.latitude,
      longitude: courierCoordinate.longitude,
      radiusInKm: 10,
      page: 2,
      limit: 10,
    })

    expect(result.isRight()).toBe(true)

    if (result.isLeft()) {
      throw new Error('Expected right result')
    }

    expect(result.value.deliveries).toHaveLength(2)
  })
})
