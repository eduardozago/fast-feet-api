import { InMemoryDeliveriesRepository } from 'test/repositories/delivery/in-memory-deliveries-repository'
import { makeDelivery } from 'test/factories/delivery/make-delivery'
import { DeliveryStatus } from '@/domain/delivery/enterprise/entities/delivery'
import { CannotCompleteDeliveryError } from './errors/cannot-complete-delivery-error'
import { CompleteDeliveryUseCase } from './complete-delivery'
import { InMemoryCouriersRepository } from 'test/repositories/delivery/in-memory-couriers-repository'
import { InMemoryDeliveryCompletionRepository } from 'test/repositories/delivery/in-memory-delivery-completion-repository'
import { InMemoryRecipientsRepository } from 'test/repositories/delivery/in-memory-recipients-repository'
import { InMemoryRecipientAddressesRepository } from 'test/repositories/delivery/in-memory-recipient-addresses-repository'
import { makeCourier } from 'test/factories/delivery/make-courier'
import { makeRecipient } from 'test/factories/delivery/make-recipient'
import { makeRecipientAddress } from 'test/factories/delivery/make-recipient-address'
import {
  LocationValidationStatus,
  ProofOfDelivery,
  ProofType,
  RecipientRelationship,
} from '@/domain/delivery/enterprise/entities/proof-of-delivery'
import { makeIdentityDocument } from 'test/factories/delivery/make-identity-type'
import { InvalidProofOfDeliveryError } from './errors/invalid-proof-of-delivery-error'
import { InvalidCourierAssignedError } from './errors/invalid-courier-assigned-error'
import { ProofOfDeliveryAlreadyExistsError } from './errors/proof-of-delivery-already-exists-error'

let deliveriesRepository: InMemoryDeliveriesRepository
let couriersRepository: InMemoryCouriersRepository
let deliveryCompletionRepository: InMemoryDeliveryCompletionRepository
let recipientsRepository: InMemoryRecipientsRepository
let recipientAddressesRepository: InMemoryRecipientAddressesRepository
let sut: CompleteDeliveryUseCase

describe('Complete Delivery', () => {
  beforeEach(() => {
    deliveriesRepository = new InMemoryDeliveriesRepository()
    couriersRepository = new InMemoryCouriersRepository()
    deliveryCompletionRepository = new InMemoryDeliveryCompletionRepository(
      deliveriesRepository,
    )
    recipientsRepository = new InMemoryRecipientsRepository()
    recipientAddressesRepository = new InMemoryRecipientAddressesRepository()

    sut = new CompleteDeliveryUseCase(
      deliveriesRepository,
      couriersRepository,
      deliveryCompletionRepository,
      recipientsRepository,
      recipientAddressesRepository,
    )
  })

  it('should be able to complete delivery with proof of delivery', async () => {
    const courier = makeCourier()
    const recipient = makeRecipient({
      identityDocument: makeIdentityDocument({
        number: '12345678900',
      }),
    })
    const recipientAddress = makeRecipientAddress({
      recipientId: recipient.id,
      latitude: -23.55052,
      longitude: -46.633308,
    })
    const delivery = makeDelivery({
      recipientId: recipient.id,
      recipientAddressId: recipientAddress.id,
      courierId: courier.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await couriersRepository.create(courier)
    await recipientsRepository.create(recipient)
    await recipientAddressesRepository.create(recipientAddress)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
      receivedByName: recipient.name,
      receivedByDocument: '12345678900',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
      latitude: -23.55052,
      longitude: -46.633308,
    })

    expect(result.isRight()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.COMPLETED,
    )
    expect(deliveryCompletionRepository.items).toHaveLength(1)
    expect(deliveryCompletionRepository.items[0].deliveryId).toEqual(
      delivery.id,
    )
    expect(deliveryCompletionRepository.items[0].courierId).toEqual(courier.id)
    expect(deliveryCompletionRepository.items[0].documentMatchesRecipient).toBe(
      true,
    )
    expect(deliveryCompletionRepository.items[0].locationValidationStatus).toBe(
      LocationValidationStatus.WITHIN_RANGE,
    )
  })

  it('should be able to complete delivery received by another person with notes', async () => {
    const courier = makeCourier()
    const recipient = makeRecipient({
      identityDocument: makeIdentityDocument({
        number: '12345678900',
      }),
    })
    const recipientAddress = makeRecipientAddress({
      recipientId: recipient.id,
    })
    const delivery = makeDelivery({
      recipientId: recipient.id,
      recipientAddressId: recipientAddress.id,
      courierId: courier.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await couriersRepository.create(courier)
    await recipientsRepository.create(recipient)
    await recipientAddressesRepository.create(recipientAddress)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
      receivedByName: 'John Doe',
      proofImageUrl: 'https://example.com/proofs/proof.jpg',
      recipientRelationship: RecipientRelationship.DOORMAN,
      proofType: ProofType.PHOTO,
      notes: 'Delivered to the building doorman.',
    })

    expect(result.isRight()).toBe(true)
    expect(deliveryCompletionRepository.items[0].documentMatchesRecipient).toBe(
      false,
    )
    expect(deliveryCompletionRepository.items[0].locationValidationStatus).toBe(
      LocationValidationStatus.UNAVAILABLE,
    )
  })

  it('should not be able to complete delivery if delivery is not in transit', async () => {
    const delivery = makeDelivery({
      status: DeliveryStatus.CREATED,
    })

    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: 'account-id',
      receivedByName: 'John Doe',
      receivedByDocument: '12345678900',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(DeliveryStatus.CREATED)
    expect(deliveryCompletionRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(CannotCompleteDeliveryError)
  })

  it('should not be able to complete delivery without proof evidence', async () => {
    const courier = makeCourier()
    const recipient = makeRecipient()
    const recipientAddress = makeRecipientAddress({
      recipientId: recipient.id,
    })
    const delivery = makeDelivery({
      recipientId: recipient.id,
      recipientAddressId: recipientAddress.id,
      courierId: courier.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await couriersRepository.create(courier)
    await recipientsRepository.create(recipient)
    await recipientAddressesRepository.create(recipientAddress)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
      receivedByName: 'John Doe',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(deliveryCompletionRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(InvalidProofOfDeliveryError)
  })

  it('should not be able to complete delivery assigned to another courier', async () => {
    const assignedCourier = makeCourier()
    const anotherCourier = makeCourier()
    const delivery = makeDelivery({
      courierId: assignedCourier.id,
      status: DeliveryStatus.IN_TRANSIT,
    })

    await couriersRepository.create(assignedCourier)
    await couriersRepository.create(anotherCourier)
    await deliveriesRepository.create(delivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: anotherCourier.accountId.toString(),
      receivedByName: 'John Doe',
      receivedByDocument: '12345678900',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(deliveryCompletionRepository.items).toHaveLength(0)
    expect(result.value).toBeInstanceOf(InvalidCourierAssignedError)
  })

  it('should not be able to complete delivery twice', async () => {
    const courier = makeCourier()
    const recipient = makeRecipient()
    const recipientAddress = makeRecipientAddress({
      recipientId: recipient.id,
    })
    const delivery = makeDelivery({
      recipientId: recipient.id,
      recipientAddressId: recipientAddress.id,
      courierId: courier.id,
      status: DeliveryStatus.IN_TRANSIT,
    })
    const proofOfDelivery = ProofOfDelivery.create({
      deliveryId: delivery.id,
      courierId: courier.id,
      receivedByName: 'John Doe',
      receivedByDocument: '12345678900',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
      locationValidationStatus: LocationValidationStatus.UNAVAILABLE,
      documentMatchesRecipient: false,
    })

    await couriersRepository.create(courier)
    await recipientsRepository.create(recipient)
    await recipientAddressesRepository.create(recipientAddress)
    await deliveriesRepository.create(delivery)
    deliveryCompletionRepository.items.push(proofOfDelivery)

    const result = await sut.execute({
      deliveryId: delivery.id.toString(),
      accountId: courier.accountId.toString(),
      receivedByName: 'John Doe',
      receivedByDocument: '12345678900',
      recipientRelationship: RecipientRelationship.RECIPIENT,
      proofType: ProofType.DOCUMENT,
    })

    expect(result.isLeft()).toBe(true)
    expect(deliveriesRepository.items[0].status).toEqual(
      DeliveryStatus.IN_TRANSIT,
    )
    expect(deliveryCompletionRepository.items).toHaveLength(1)
    expect(result.value).toBeInstanceOf(ProofOfDeliveryAlreadyExistsError)
  })
})
