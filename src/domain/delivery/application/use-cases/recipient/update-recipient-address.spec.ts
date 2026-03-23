import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { UpdateRecipientAddressUseCase } from './update-recipient-address'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'

let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let sut: UpdateRecipientAddressUseCase

describe('Update Recipient Address', () => {
  beforeEach(() => {
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    sut = new UpdateRecipientAddressUseCase(recipientAddressesRepository)
  })

  it('should be able to update a recipient', async () => {
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
      street: 'Street 2',
      number: '2',
      neighborhood: 'Neighborhood 2',
      city: 'City 2',
      state: 'State 2',
      country: 'Country 2',
      postalCode: '87654-321',
    })

    expect(result.isRight()).toBe(true)
    expect(recipientAddressesRepository.items).toHaveLength(1)
    expect(recipientAddressesRepository.items[0]).toEqual(
      expect.objectContaining({
        street: 'Street 2',
        number: '2',
        neighborhood: 'Neighborhood 2',
        city: 'City 2',
        state: 'State 2',
        country: 'Country 2',
        postalCode: '87654-321',
      }),
    )
  })
})
