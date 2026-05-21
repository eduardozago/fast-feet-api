import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProofOfDelivery } from '@/domain/delivery/enterprise/entities/proof-of-delivery'
import {
  Prisma,
  ProofOfDelivery as PrismaProofOfDelivery,
} from 'generated/prisma/client'

export class PrismaProofOfDeliveryMapper {
  static toDomain(raw: PrismaProofOfDelivery) {
    return ProofOfDelivery.create(
      {
        deliveryId: new UniqueEntityID(raw.deliveryId),
        courierId: new UniqueEntityID(raw.courierId),
        receivedByName: raw.receivedByName,
        receivedByDocument: raw.receivedByDocument,
        recipientRelationship: raw.recipientRelationship,
        proofType: raw.proofType,
        proofImageUrl: raw.proofImageUrl,
        latitude: raw.latitude?.toNumber() ?? null,
        longitude: raw.longitude?.toNumber() ?? null,
        distanceFromDestinationInKm:
          raw.distanceFromDestinationInKm?.toNumber() ?? null,
        locationValidationStatus: raw.locationValidationStatus,
        documentMatchesRecipient: raw.documentMatchesRecipient,
        notes: raw.notes,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    proofOfDelivery: ProofOfDelivery,
  ): Prisma.ProofOfDeliveryUncheckedCreateInput {
    return {
      id: proofOfDelivery.id.toString(),
      deliveryId: proofOfDelivery.deliveryId.toString(),
      courierId: proofOfDelivery.courierId.toString(),
      receivedByName: proofOfDelivery.receivedByName,
      receivedByDocument: proofOfDelivery.receivedByDocument,
      recipientRelationship: proofOfDelivery.recipientRelationship,
      proofType: proofOfDelivery.proofType,
      proofImageUrl: proofOfDelivery.proofImageUrl,
      latitude: proofOfDelivery.latitude,
      longitude: proofOfDelivery.longitude,
      distanceFromDestinationInKm: proofOfDelivery.distanceFromDestinationInKm,
      locationValidationStatus: proofOfDelivery.locationValidationStatus,
      documentMatchesRecipient: proofOfDelivery.documentMatchesRecipient,
      notes: proofOfDelivery.notes,
      createdAt: proofOfDelivery.createdAt,
    }
  }
}
