import { CreateRecipientUseCase } from './create-recipient'
import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { makeRecipient } from 'test/factories/delivery/make-recipient'

let recipientsRepository: InMemoryRecipientsRepository
let sut: CreateRecipientUseCase

describe('Create Recipient', () => {
  beforeEach(() => {
    recipientsRepository = new InMemoryRecipientsRepository()
    sut = new CreateRecipientUseCase(recipientsRepository)
  })

  it('should be able to create a recipient', async () => {
    const recipient = makeRecipient()

    const result = await sut.execute({
      name: recipient.name,
      identityDocument: {
        type: recipient.identityDocument.type,
        number: recipient.identityDocument.number,
        issuingCountry: recipient.identityDocument.issuingCountry,
      },
    })

    expect(result.isRight()).toBe(true)
    expect(recipientsRepository.items).toHaveLength(1)
    expect(recipientsRepository.items[0].identityDocument).toEqual(
      expect.objectContaining({
        type: recipient.identityDocument.type,
        number: recipient.identityDocument.number,
        issuingCountry: recipient.identityDocument.issuingCountry,
      }),
    )
  })
})
