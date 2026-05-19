import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DeliveriesRepository } from '../../repositories/deliveries-repository'
import { Delivery } from '@/domain/delivery/enterprise/entities/delivery'
import { DeliveryNotFoundError } from './errors/delivery-not-found-error'
import { CannotCompleteDeliveryError } from './errors/cannot-complete-delivery-error'
import { CouriersRepository } from '../../repositories/couriers-repository'
import { CourierNotFoundError } from '../courier/errors/courier-not-found-error'
import { DeliveryCompletionRepository } from '../../repositories/delivery-completion-repository'
import {
  LocationValidationStatus,
  ProofOfDelivery,
  ProofType,
  RecipientRelationship,
} from '@/domain/delivery/enterprise/entities/proof-of-delivery'
import { InvalidCourierAssignedError } from './errors/invalid-courier-assigned-error'
import { ProofOfDeliveryAlreadyExistsError } from './errors/proof-of-delivery-already-exists-error'
import { InvalidProofOfDeliveryError } from './errors/invalid-proof-of-delivery-error'
import { RecipientsRepository } from '../../repositories/recipients-repository'
import { RecipientAddressesRepository } from '../../repositories/recipient-addresses-repository'
import { RecipientNotFoundError } from '../recipient/errors/recipient-not-found-error'
import { RecipientAddressNotFoundError } from '../recipient/errors/recipient-address-not-found-error'
import { Coordinate } from '@/domain/delivery/enterprise/entities/value-objects/coordinate'

interface CompleteDeliveryUseCaseRequest {
  deliveryId: string
  accountId: string
  receivedByName: string
  receivedByDocument?: string | null
  recipientRelationship: RecipientRelationship
  proofType: ProofType
  proofImageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
}

export type CompleteDeliveryUseCaseResponse = Either<
  | DeliveryNotFoundError
  | CannotCompleteDeliveryError
  | CourierNotFoundError
  | InvalidCourierAssignedError
  | ProofOfDeliveryAlreadyExistsError
  | InvalidProofOfDeliveryError
  | RecipientNotFoundError
  | RecipientAddressNotFoundError,
  {
    delivery: Delivery
    proofOfDelivery: ProofOfDelivery
  }
>

@Injectable()
export class CompleteDeliveryUseCase {
  constructor(
    private deliveriesRepository: DeliveriesRepository,
    private couriersRepository: CouriersRepository,
    private deliveryCompletionRepository: DeliveryCompletionRepository,
    private recipientsRepository: RecipientsRepository,
    private recipientAddressesRepository: RecipientAddressesRepository,
  ) {}

  async execute({
    deliveryId,
    accountId,
    receivedByName,
    receivedByDocument,
    recipientRelationship,
    proofType,
    proofImageUrl,
    latitude,
    longitude,
    notes,
  }: CompleteDeliveryUseCaseRequest): Promise<CompleteDeliveryUseCaseResponse> {
    const delivery = await this.deliveriesRepository.findById(deliveryId)

    if (!delivery) {
      return left(new DeliveryNotFoundError())
    }

    if (!delivery.canComplete()) {
      return left(new CannotCompleteDeliveryError(delivery.status))
    }

    if (!delivery.courierId) {
      return left(
        new InvalidCourierAssignedError('No courier assigned to this delivery'),
      )
    }

    const courier = await this.couriersRepository.findByAccountId(accountId)

    if (!courier) {
      return left(new CourierNotFoundError())
    }

    const isCourierAssigned = delivery.courierId.equals(courier.id)

    if (!isCourierAssigned) {
      return left(new InvalidCourierAssignedError())
    }

    const existingProof =
      await this.deliveryCompletionRepository.findProofByDeliveryId(deliveryId)

    if (existingProof) {
      return left(new ProofOfDeliveryAlreadyExistsError())
    }

    if (!receivedByName.trim()) {
      return left(
        new InvalidProofOfDeliveryError('Receiver name must be provided.'),
      )
    }

    if (!receivedByDocument?.trim() && !proofImageUrl?.trim()) {
      return left(
        new InvalidProofOfDeliveryError(
          'Either receiver document or proof image URL must be provided.',
        ),
      )
    }

    if (
      recipientRelationship !== RecipientRelationship.RECIPIENT &&
      !notes?.trim()
    ) {
      return left(
        new InvalidProofOfDeliveryError(
          'Notes must be provided when delivery is received by someone other than the recipient.',
        ),
      )
    }

    const recipient = await this.recipientsRepository.findById(
      delivery.recipientId.toString(),
    )

    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    const recipientAddress = await this.recipientAddressesRepository.findById(
      delivery.recipientAddressId.toString(),
    )

    if (!recipientAddress) {
      return left(new RecipientAddressNotFoundError())
    }

    const hasLatitude = latitude !== undefined && latitude !== null
    const hasLongitude = longitude !== undefined && longitude !== null

    if (hasLatitude !== hasLongitude) {
      return left(
        new InvalidProofOfDeliveryError(
          'Latitude and longitude must be provided together.',
        ),
      )
    }

    let distanceFromDestinationInKm: number | null = null
    let locationValidationStatus: LocationValidationStatus =
      LocationValidationStatus.UNAVAILABLE

    if (hasLatitude && hasLongitude) {
      const courierCoordinate = Coordinate.create({
        latitude,
        longitude,
      })
      const recipientCoordinate = Coordinate.create({
        latitude: recipientAddress.latitude,
        longitude: recipientAddress.longitude,
      })

      distanceFromDestinationInKm =
        courierCoordinate.distanceTo(recipientCoordinate)
      locationValidationStatus =
        distanceFromDestinationInKm <= 0.3
          ? LocationValidationStatus.WITHIN_RANGE
          : LocationValidationStatus.OUT_OF_RANGE
    }

    const proofOfDelivery = ProofOfDelivery.create({
      deliveryId: delivery.id,
      courierId: courier.id,
      receivedByName,
      receivedByDocument,
      recipientRelationship,
      proofType,
      proofImageUrl,
      latitude,
      longitude,
      distanceFromDestinationInKm,
      locationValidationStatus,
      documentMatchesRecipient:
        receivedByDocument === recipient.identityDocument.number,
      notes,
    })

    delivery.complete()

    await this.deliveryCompletionRepository.complete(delivery, proofOfDelivery)

    return right({
      delivery,
      proofOfDelivery,
    })
  }
}
