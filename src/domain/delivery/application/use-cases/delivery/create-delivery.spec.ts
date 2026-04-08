import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'
import { CreateDeliveryUseCase } from './create-delivery'
import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import { RecipientNotFoundError } from '../recipient/errors/recipient-not-found-error'
import { RecipientAddressNotFoundError } from '../recipient/errors/recipient-address-not-found-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let recipientsRepository: InMemoryRecipientsRepository
let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let sut: CreateDeliveryUseCase

describe('Create Delivery', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    deliveriesRepository = new InMemoryDeliveriesRepository()
    sut = new CreateDeliveryUseCase(
      deliveriesRepository,
      recipientsRepository,
      recipientAddressesRepository,
    )
  })

  it('should be able to create a delivery', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const recipientAddress = makeRecipientAddress({
      recipientId: recipient.id,
    })
    await recipientAddressesRepository.create(recipientAddress)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      recipientAddressId: recipientAddress.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items).toHaveLength(1)
    expect(deliveriesRepository.items[0].recipientId).toEqual(recipient.id)
    expect(deliveriesRepository.items[0].recipientAddressId).toEqual(
      recipientAddress.id,
    )
  })

  it('should not be able to create a delivery with invalid recipient ID', async () => {
    const result = await sut.execute({
      recipientId: 'invalid-recipient-id',
      recipientAddressId: 'invalid-recipient-address-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
  })

  it('should not be able to create a delivery with invalid recipient address ID', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      recipientAddressId: 'invalid-recipient-address-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(RecipientAddressNotFoundError)
  })
})
