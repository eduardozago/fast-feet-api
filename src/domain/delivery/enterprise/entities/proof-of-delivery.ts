import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Entity } from '@/core/entities/entity'

export const RecipientRelationship = {
  RECIPIENT: 'RECIPIENT',
  FAMILY_MEMBER: 'FAMILY_MEMBER',
  DOORMAN: 'DOORMAN',
  RECEPTIONIST: 'RECEPTIONIST',
  NEIGHBOR: 'NEIGHBOR',
  OTHER: 'OTHER',
} as const

export type RecipientRelationship =
  (typeof RecipientRelationship)[keyof typeof RecipientRelationship]

export const ProofType = {
  DOCUMENT: 'DOCUMENT',
  PHOTO: 'PHOTO',
  SIGNATURE: 'SIGNATURE',
  MANUAL: 'MANUAL',
} as const

export type ProofType = (typeof ProofType)[keyof typeof ProofType]

export const LocationValidationStatus = {
  WITHIN_RANGE: 'WITHIN_RANGE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const

export type LocationValidationStatus =
  (typeof LocationValidationStatus)[keyof typeof LocationValidationStatus]

export interface ProofOfDeliveryProps {
  deliveryId: UniqueEntityID
  courierId: UniqueEntityID
  receivedByName: string
  receivedByDocument?: string | null
  recipientRelationship: RecipientRelationship
  proofType: ProofType
  proofImageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  distanceFromDestinationInKm?: number | null
  locationValidationStatus: LocationValidationStatus
  documentMatchesRecipient: boolean
  notes?: string | null
  createdAt: Date
}

export class ProofOfDelivery extends Entity<ProofOfDeliveryProps> {
  get deliveryId() {
    return this.props.deliveryId
  }

  get courierId() {
    return this.props.courierId
  }

  get receivedByName() {
    return this.props.receivedByName
  }

  get receivedByDocument() {
    return this.props.receivedByDocument
  }

  get recipientRelationship() {
    return this.props.recipientRelationship
  }

  get proofType() {
    return this.props.proofType
  }

  get proofImageUrl() {
    return this.props.proofImageUrl
  }

  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  get distanceFromDestinationInKm() {
    return this.props.distanceFromDestinationInKm
  }

  get locationValidationStatus() {
    return this.props.locationValidationStatus
  }

  get documentMatchesRecipient() {
    return this.props.documentMatchesRecipient
  }

  get notes() {
    return this.props.notes
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<ProofOfDeliveryProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const proofOfDelivery = new ProofOfDelivery(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return proofOfDelivery
  }
}
