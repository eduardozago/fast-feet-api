import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { DeleteRecipientAddressUseCase } from './delete-recipient-address'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import { RecipientAddressNotFoundError } from './errors/recipient-address-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let sut: DeleteRecipientAddressUseCase

describe('Delete Recipient Address', () => {
  beforeEach(() => {
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    sut = new DeleteRecipientAddressUseCase(recipientAddressesRepository)
  })

  it('should be able to delete a recipient address', async () => {
    const recipientId = new UniqueEntityID()
    const recipientAddress = makeRecipientAddress({
      recipientId,
      street: 'Street 1',
      number: '1',
      neighborhood: 'Neighborhood 1',
      city: 'City 1',
      state: 'State 1',
      country: 'Country 1',
      postalCode: '12345-678',
    })
    await recipientAddressesRepository.create(recipientAddress)

    const result = await sut.execute({
      recipientId: recipientId.toString(),
      recipientAddressId: recipientAddress.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(recipientAddressesRepository.items).toHaveLength(0)
  })

  it('should not be able to delete an address that does not belong to the recipient', async () => {
    const recipientAddress = makeRecipientAddress({
      recipientId: new UniqueEntityID('recipient-1'),
    })
    await recipientAddressesRepository.create(recipientAddress)

    const result = await sut.execute({
      recipientId: 'recipient-2',
      recipientAddressId: recipientAddress.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientAddressNotFoundError)
    expect(recipientAddressesRepository.items).toHaveLength(1)
  })
})
