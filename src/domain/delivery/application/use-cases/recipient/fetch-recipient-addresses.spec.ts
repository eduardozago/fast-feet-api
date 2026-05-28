import { makeRecipient } from 'test/factories/delivery/make-recipient'
import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { FetchRecipientAddressesUseCase } from './fetch-recipient-addresses'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'

let recipientAdressesRepository: InMemoryRecipientAddressesRepository
let sut: FetchRecipientAddressesUseCase

describe('Fetch Recipient Addresses', () => {
  beforeEach(() => {
    recipientAdressesRepository = new InMemoryRecipientAddressesRepository()
    sut = new FetchRecipientAddressesUseCase(recipientAdressesRepository)
  })

  it('should be able to fetch recipient addresses by recipient', async () => {
    const recipient = makeRecipient()

    const address1 = makeRecipientAddress({
      recipientId: recipient.id,
    })
    const address2 = makeRecipientAddress({
      recipientId: recipient.id,
    })

    await recipientAdressesRepository.create(address1)
    await recipientAdressesRepository.create(address2)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.recipientAddresses).toHaveLength(2)
  })
})
