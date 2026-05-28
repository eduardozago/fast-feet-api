import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { UpdateRecipientAddressUseCase } from './update-recipient-address'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import { FakeGeocodingService } from 'test/location/fake-geocoding-service'
import { GeocodingServiceError } from '../errors/geocoding-service-error'
import { RecipientAddressNotFoundError } from './errors/recipient-address-not-found-error'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let geocodingService: FakeGeocodingService
let sut: UpdateRecipientAddressUseCase

describe('Update Recipient Address', () => {
  beforeEach(() => {
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()
    geocodingService = new FakeGeocodingService()
    sut = new UpdateRecipientAddressUseCase(
      recipientAddressesRepository,
      geocodingService,
    )
  })

  it('should be able to update a recipient address', async () => {
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
      recipientId: recipientAddress.recipientId.toString(),
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
    expect(recipientAddressesRepository.items[0].latitude).toBeDefined()
    expect(recipientAddressesRepository.items[0].longitude).toBeDefined()
  })

  it('should not be able to update an address that does not belong to the recipient', async () => {
    const recipientAddress = makeRecipientAddress({
      recipientId: new UniqueEntityID('recipient-1'),
    })
    await recipientAddressesRepository.create(recipientAddress)

    const result = await sut.execute({
      recipientId: 'recipient-2',
      recipientAddressId: recipientAddress.id.toString(),
      street: 'Street 2',
      number: '2',
      neighborhood: 'Neighborhood 2',
      city: 'City 2',
      state: 'State 2',
      country: 'Country 2',
      postalCode: '87654-321',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientAddressNotFoundError)
    expect(recipientAddressesRepository.items[0].street).not.toBe('Street 2')
  })

  it('should not be able to update an address if geocoding fails', async () => {
    const recipientId = new UniqueEntityID()
    const recipientAddress = makeRecipientAddress({
      recipientId,
      street: 'Street 1',
    })
    await recipientAddressesRepository.create(recipientAddress)

    geocodingService.shouldFail = true

    const result = await sut.execute({
      recipientId: recipientId.toString(),
      recipientAddressId: recipientAddress.id.toString(),
      street: 'Street 2',
      number: '2',
      neighborhood: 'Neighborhood 2',
      city: 'City 2',
      state: 'State 2',
      country: 'Country 2',
      postalCode: '87654-321',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(GeocodingServiceError)
    expect(recipientAddressesRepository.items[0].street).toBe('Street 1')
  })
})
