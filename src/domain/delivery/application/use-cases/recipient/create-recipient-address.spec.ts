import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'
import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { CreateRecipientAddressUseCase } from './create-recipient-address'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

let recipientAdressesRepository: InMemoryRecipientAddressesRepository
let recipientsRepository: InMemoryRecipientsRepository
let sut: CreateRecipientAddressUseCase

describe('Create Recipient Address', () => {
  beforeEach(() => {
    recipientAdressesRepository = new InMemoryRecipientAddressesRepository()
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new CreateRecipientAddressUseCase(
      recipientAdressesRepository,
      recipientsRepository,
    )
  })

  it('should be able to create a recipient address', async () => {
    const recipient = makeRecipient()
    await recipientsRepository.create(recipient)

    const result = await sut.execute({
      recipientId: recipient.id.toString(),
      street: 'Street 1',
      number: '123',
      complement: 'Complement 1',
      neighborhood: 'Neighborhood 1',
      city: 'City 1',
      state: 'State 1',
      postalCode: '12345-678',
      country: 'Country 1',
    })

    expect(result.isRight()).toBe(true)
    expect(recipientAdressesRepository.items).toHaveLength(1)
    expect(recipientAdressesRepository.items[0]).toEqual(
      expect.objectContaining({
        recipientId: recipient.id,
        street: 'Street 1',
        number: '123',
        complement: 'Complement 1',
        neighborhood: 'Neighborhood 1',
        city: 'City 1',
        state: 'State 1',
        postalCode: '12345-678',
        country: 'Country 1',
      }),
    )
  })

  it('should not be able to create a recipient address if recipient does not exist', async () => {
    const result = await sut.execute({
      recipientId: 'non-existent-recipient-id',
      street: 'Street 1',
      number: '123',
      complement: 'Complement 1',
      neighborhood: 'Neighborhood 1',
      city: 'City 1',
      state: 'State 1',
      postalCode: '12345-678',
      country: 'Country 1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
    expect(recipientAdressesRepository.items).toHaveLength(0)
  })
})
