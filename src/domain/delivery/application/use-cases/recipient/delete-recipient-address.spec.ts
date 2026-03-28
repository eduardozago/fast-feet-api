import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { DeleteRecipientAddressUseCase } from './delete-recipient-address'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'

let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let sut: DeleteRecipientAddressUseCase

describe('Delete Recipient Address', () => {
  beforeEach(() => {
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    sut = new DeleteRecipientAddressUseCase(recipientAddressesRepository)
  })

  it('should be able to delete a recipient address', async () => {
    const recipientAddress = makeRecipientAddress({
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
      recipientAddressId: recipientAddress.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(recipientAddressesRepository.items).toHaveLength(0)
  })
})
